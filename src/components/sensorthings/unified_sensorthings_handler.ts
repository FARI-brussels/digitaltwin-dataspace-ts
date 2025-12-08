import { Handler, servableEndpoint, DatabaseAdapter } from 'digitaltwin-core'
import type { ComponentConfiguration, DataResponse } from 'digitaltwin-core'
import { getPollutant } from './pollutants.js'

// SensorThings types
export interface STThing {
    '@iot.id': string | number
    '@iot.selfLink': string
    name: string
    description: string
    properties: Record<string, unknown>
    Locations: Array<{ '@iot.id': string | number; name: string; description: string; encodingType: string; location: { type: string; coordinates: number[] } }>
    Datastreams: Array<{
        '@iot.id': string
        name: string
        description: string
        observationType: string
        unitOfMeasurement: { name: string; symbol: string; definition: string }
        ObservedProperty: { '@iot.id': string; name: string; description: string; definition: string }
        Sensor: { '@iot.id': string | number; name: string; description: string; encodingType: string; metadata: string }
        Observations: Array<{ '@iot.id': string | number; phenomenonTime: string; resultTime: string; result: number }>
    }>
}

export type SourceTransformer = (data: unknown[]) => STThing[]

export interface SourceConfig {
    collectorName: string
    transform: SourceTransformer
}

/**
 * Generic unified SensorThings handler
 * Add sources by passing transformers to the constructor
 */
export class UnifiedSensorThingsHandler extends Handler {
    private db: DatabaseAdapter
    private sources: Record<string, SourceConfig>
    private baseUrl: string

    constructor(database: DatabaseAdapter, sources: Record<string, SourceConfig>, baseUrl = '/api/sensorthings/v1.1') {
        super()
        this.db = database
        this.sources = sources
        this.baseUrl = baseUrl
    }

    getConfiguration(): ComponentConfiguration {
        return { name: 'unified_sensorthings', description: 'Unified SensorThings API', contentType: 'application/json', tags: ['SensorThings'] }
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/Things', method: 'GET' })
    async getThings(p: { source?: string }): Promise<DataResponse> {
        return this.collection(await this.fetchThings(p.source))
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/Things/:id', method: 'GET' })
    async getThing({ id }: { id: string }): Promise<DataResponse> {
        const thing = (await this.fetchThings()).find(t => String(t['@iot.id']) === id)
        return thing ? this.json(thing) : this.error(404, `Thing(${id}) not found`)
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/Datastreams', method: 'GET' })
    async getDatastreams(p: { source?: string; property?: string }): Promise<DataResponse> {
        const ds = (await this.fetchThings(p.source)).flatMap(t => t.Datastreams.map(d => ({ ...d, 'Thing@iot.navigationLink': `${this.baseUrl}/Things(${t['@iot.id']})` })))
        return this.collection(this.filterProp(ds, p.property))
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/Observations', method: 'GET' })
    async getObservations(p: { source?: string; property?: string }): Promise<DataResponse> {
        const obs = (await this.fetchThings(p.source)).flatMap(t => t.Datastreams.flatMap(d => d.Observations.map(o => ({
            ...o, observedProperty: d.ObservedProperty.name, observedPropertyId: d.ObservedProperty['@iot.id'], unit: d.unitOfMeasurement.symbol,
            stationId: t['@iot.id'], stationName: t.name, location: t.Locations[0]?.location, 'Datastream@iot.navigationLink': `${this.baseUrl}/Datastreams(${d['@iot.id']})`
        }))))
        return this.collection(this.filterProp(obs, p.property))
    }

    @servableEndpoint({ path: '/api/sensorthings/v1.1/ObservedProperties', method: 'GET' })
    async getObservedProperties(p: { source?: string }): Promise<DataResponse> {
        const props = new Map<string, { '@iot.id': string; name: string; description: string; definition: string }>()
        for (const t of await this.fetchThings(p.source)) for (const d of t.Datastreams) if (!props.has(d.ObservedProperty['@iot.id'])) props.set(d.ObservedProperty['@iot.id'], d.ObservedProperty)
        return this.collection(Array.from(props.values()).map(p => ({ ...p, '@iot.selfLink': `${this.baseUrl}/ObservedProperties(${p['@iot.id']})` })))
    }

    private async fetchThings(sourceFilter?: string): Promise<STThing[]> {
        const all: STThing[] = []
        const toFetch = sourceFilter ? { [sourceFilter]: this.sources[sourceFilter] } : this.sources
        for (const [name, cfg] of Object.entries(toFetch)) {
            if (!cfg) continue
            const rec = await this.db.getLatestByName(cfg.collectorName)
            if (!rec) continue
            const things = cfg.transform(JSON.parse((await rec.data()).toString('utf-8')))
            things.forEach(t => { t.properties.source = name; t['@iot.id'] = `${name}-${t['@iot.id']}`; t['@iot.selfLink'] = `${this.baseUrl}/Things(${t['@iot.id']})` })
            all.push(...things)
        }
        return all
    }

    private filterProp<T extends { observedProperty?: string; ObservedProperty?: { '@iot.id': string; name: string } }>(items: T[], filter?: string): T[] {
        if (!filter) return items
        const f = filter.split(',').map(p => p.trim().toLowerCase())
        return items.filter(i => f.some(p => (i.observedProperty || i.ObservedProperty?.name || '').toLowerCase().includes(p) || (i.ObservedProperty?.['@iot.id'] || '').toLowerCase().includes(p)))
    }

    private json(data: unknown): DataResponse { return { status: 200, content: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } } }
    private collection(items: unknown[]): DataResponse { return this.json({ '@iot.count': items.length, value: items }) }
    private error(status: number, msg: string): DataResponse { return { status, content: JSON.stringify({ error: msg }), headers: { 'Content-Type': 'application/json' } } }
}

// Helper to create datastreams using shared ontology
export function createDatastream(id: string, stationLabel: string, property: string, unit: string | undefined, sensorId: string | number, sensorName: string, observations: STThing['Datastreams'][0]['Observations']): STThing['Datastreams'][0] {
    const p = getPollutant(property, unit)
    return {
        '@iot.id': id, name: `${p.name} at ${stationLabel}`, description: `${p.description} at ${stationLabel}`, observationType: 'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement',
        unitOfMeasurement: { name: p.unitName, symbol: p.unit, definition: p.unitDefinition },
        ObservedProperty: { '@iot.id': p.id, name: p.name, description: p.description, definition: p.definition },
        Sensor: { '@iot.id': sensorId, name: sensorName, description: sensorName, encodingType: 'application/pdf', metadata: '' },
        Observations: observations
    }
}

