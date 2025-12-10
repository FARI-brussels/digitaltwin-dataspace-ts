import { Handler, servableEndpoint, DatabaseAdapter } from 'digitaltwin-core'
import type { ComponentConfiguration, DataResponse } from 'digitaltwin-core'
import type { STThing, STCollection } from './types.js'

/**
 * Configuration for a SensorThings data source
 */
export interface SensorThingsSource {
    /** Collector name in database */
    collectorName: string
    /** Human-readable label */
    label: string
}

/**
 * Unified SensorThings API handler
 *
 * This handler aggregates data from multiple SensorThings collectors.
 * The collectors already output SensorThings format, so this handler
 * simply fetches and merges the data.
 *
 * Endpoints:
 * - GET /api/sensorthings/v1.1/Things - All things from all sources
 * - GET /api/sensorthings/v1.1/Things?source=irceline - Filter by source
 * - GET /api/sensorthings/v1.1/Things/:id - Single thing by ID
 * - GET /api/sensorthings/v1.1/Datastreams - All datastreams
 * - GET /api/sensorthings/v1.1/Observations - All observations
 * - GET /api/sensorthings/v1.1/ObservedProperties - Unique observed properties
 */
export class SensorThingsHandler extends Handler {
    private db: DatabaseAdapter
    private sources: Record<string, SensorThingsSource>

    constructor(database: DatabaseAdapter, sources: Record<string, SensorThingsSource>) {
        super()
        this.db = database
        this.sources = sources
    }

    getConfiguration(): ComponentConfiguration {
        return {
            name: 'sensorthings_handler',
            description: 'Unified OGC SensorThings API',
            contentType: 'application/json',
            tags: ['SensorThings', 'OGC', 'Air Quality']
        }
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/Things', method: 'GET' })
    async getThings(params: { source?: string }): Promise<DataResponse> {
        const things = await this.fetchThings(params.source)
        return this.collection(things)
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/Things/:id', method: 'GET' })
    async getThing({ id }: { id: string }): Promise<DataResponse> {
        const things = await this.fetchThings()
        const thing = things.find(t => String(t['@iot.id']) === id)

        if (!thing) {
            return this.error(404, `Thing(${id}) not found`)
        }
        return this.json(thing)
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/Datastreams', method: 'GET' })
    async getDatastreams(params: { source?: string; property?: string }): Promise<DataResponse> {
        const things = await this.fetchThings(params.source)
        let datastreams = things.flatMap(t =>
            t.Datastreams.map(ds => ({
                ...ds,
                'Thing@iot.navigationLink': `/api/sensorthings/v1.1/Things(${t['@iot.id']})`
            }))
        )

        if (params.property) {
            datastreams = this.filterByProperty(datastreams, params.property)
        }

        return this.collection(datastreams)
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/Observations', method: 'GET' })
    async getObservations(params: { source?: string; property?: string }): Promise<DataResponse> {
        const things = await this.fetchThings(params.source)
        let observations = things.flatMap(t =>
            t.Datastreams.flatMap(ds =>
                ds.Observations.map(obs => ({
                    ...obs,
                    observedProperty: ds.ObservedProperty.name,
                    observedPropertyId: ds.ObservedProperty['@iot.id'],
                    unit: ds.unitOfMeasurement.symbol,
                    stationId: t['@iot.id'],
                    stationName: t.name,
                    location: t.Locations[0]?.location,
                    'Datastream@iot.navigationLink': `/api/sensorthings/v1.1/Datastreams(${ds['@iot.id']})`
                }))
            )
        )

        if (params.property) {
            observations = observations.filter(obs => {
                const filters = params.property!.split(',').map(p => p.trim().toLowerCase())
                return filters.some(f =>
                    obs.observedProperty.toLowerCase().includes(f) ||
                    obs.observedPropertyId.toLowerCase().includes(f)
                )
            })
        }

        return this.collection(observations)
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/ObservedProperties', method: 'GET' })
    async getObservedProperties(params: { source?: string }): Promise<DataResponse> {
        const things = await this.fetchThings(params.source)
        const propsMap = new Map<string, { '@iot.id': string; name: string; description: string; definition: string }>()

        for (const thing of things) {
            for (const ds of thing.Datastreams) {
                const prop = ds.ObservedProperty
                if (!propsMap.has(prop['@iot.id'])) {
                    propsMap.set(prop['@iot.id'], prop)
                }
            }
        }

        return this.collection(
            Array.from(propsMap.values()).map(p => ({
                ...p,
                '@iot.selfLink': `/api/sensorthings/v1.1/ObservedProperties(${p['@iot.id']})`
            }))
        )
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/sources', method: 'GET' })
    async getSources(): Promise<DataResponse> {
        return this.json(
            Object.entries(this.sources).map(([key, src]) => ({
                id: key,
                label: src.label,
                collectorName: src.collectorName
            }))
        )
    }

    /**
     * Fetches Things from specified source(s)
     */
    private async fetchThings(sourceFilter?: string): Promise<STThing[]> {
        const allThings: STThing[] = []

        const sourcesToFetch = sourceFilter
            ? { [sourceFilter]: this.sources[sourceFilter] }
            : this.sources

        for (const [sourceKey, source] of Object.entries(sourcesToFetch)) {
            if (!source) continue

            const record = await this.db.getLatestByName(source.collectorName)
            if (!record) continue

            const data = await record.data()
            const things: STThing[] = JSON.parse(data.toString('utf-8'))

            // Add self-links
            for (const thing of things) {
                thing['@iot.selfLink' as keyof STThing] =
                    `/api/sensorthings/v1.1/Things(${thing['@iot.id']})` as any
            }

            allThings.push(...things)
        }

        return allThings
    }

    /**
     * Filter datastreams by observed property name
     */
    private filterByProperty<T extends { ObservedProperty?: { '@iot.id': string; name: string } }>(
        items: T[],
        propertyFilter: string
    ): T[] {
        const filters = propertyFilter.split(',').map(p => p.trim().toLowerCase())
        return items.filter(item => {
            const propName = item.ObservedProperty?.name || ''
            const propId = item.ObservedProperty?.['@iot.id'] || ''
            return filters.some(f =>
                propName.toLowerCase().includes(f) ||
                propId.toLowerCase().includes(f)
            )
        })
    }

    // Response helpers
    private json(data: unknown): DataResponse {
        return {
            status: 200,
            content: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        }
    }

    private collection<T>(items: T[]): DataResponse {
        const response: STCollection<T> = {
            '@iot.count': items.length,
            value: items
        }
        return this.json(response)
    }

    private error(status: number, message: string): DataResponse {
        return {
            status,
            content: JSON.stringify({ error: message }),
            headers: { 'Content-Type': 'application/json' }
        }
    }
}
