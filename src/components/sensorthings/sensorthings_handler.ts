import { Handler, DatabaseAdapter } from 'digitaltwin-core'
import type { DataResponse } from 'digitaltwin-core'
import { getPollutant, type PollutantDefinition } from './pollutants.js'

/**
 * SensorThings API entity types
 */
export interface STLocation {
    '@iot.id': number | string
    name: string
    description: string
    encodingType: string
    location: { type: string; coordinates: number[] }
}

export interface STObservation {
    '@iot.id': number | string
    phenomenonTime: string
    resultTime: string
    result: number
}

export interface STDatastream {
    '@iot.id': string
    name: string
    description: string
    observationType: string
    unitOfMeasurement: { name: string; symbol: string; definition: string }
    ObservedProperty: { '@iot.id': string; name: string; description: string; definition: string }
    Sensor: { '@iot.id': number | string; name: string; description: string; encodingType: string; metadata: string }
    Observations: STObservation[]
}

export interface STThing {
    '@iot.id': number | string
    '@iot.selfLink': string
    name: string
    description: string
    properties: Record<string, unknown>
    Locations: STLocation[]
    Datastreams: STDatastream[]
}

/**
 * Enriched observation for filtered responses
 */
export interface EnrichedObservation extends STObservation {
    observedProperty: string
    observedPropertyId: string
    unit: string
    stationId: number | string
    stationName?: string
    location?: { type: string; coordinates: number[] }
    'Datastream@iot.navigationLink': string
}

/**
 * Abstract base class for SensorThings API handlers
 * Provides common functionality for transforming data sources to SensorThings format
 */
export abstract class SensorThingsHandler extends Handler {
    protected db: DatabaseAdapter
    protected abstract readonly baseUrl: string
    protected abstract readonly collectorName: string

    constructor(database: DatabaseAdapter) {
        super()
        this.db = database
    }

    /**
     * Fetches raw data from the collector's storage
     */
    protected async getCollectorData<T>(): Promise<T[] | null> {
        const record = await this.db.getLatestByName(this.collectorName)
        if (!record) return null
        const blob = await record.data()
        return JSON.parse(blob.toString('utf-8'))
    }

    /**
     * Creates a standardized error response
     */
    protected errorResponse(status: number, message: string): DataResponse {
        return {
            status,
            content: JSON.stringify({ error: message }),
            headers: { 'Content-Type': 'application/json' }
        }
    }

    /**
     * Creates a standardized success response
     */
    protected successResponse(data: unknown): DataResponse {
        return {
            status: 200,
            content: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        }
    }

    /**
     * Creates a SensorThings collection response
     */
    protected collectionResponse(items: unknown[]): DataResponse {
        return this.successResponse({
            '@iot.count': items.length,
            'value': items
        })
    }

    /**
     * Transforms raw source data to SensorThings Things
     * Must be implemented by subclasses
     */
    protected abstract transformToThings(rawData: unknown[]): STThing[]

    /**
     * Filters datastreams or observations by property name
     */
    protected filterByProperty<T extends { observedProperty?: string; ObservedProperty?: { '@iot.id': string; name: string } }>(
        items: T[],
        propertyFilter?: string
    ): T[] {
        if (!propertyFilter) return items

        const filters = propertyFilter.split(',').map(p => p.trim().toLowerCase())
        return items.filter(item => {
            const propName = item.observedProperty || item.ObservedProperty?.name || ''
            const propId = item.ObservedProperty?.['@iot.id'] || ''
            return filters.some(f =>
                propName.toLowerCase().includes(f) ||
                propId.toLowerCase().includes(f)
            )
        })
    }

    /**
     * Creates a Datastream from source data using shared pollutant ontology
     */
    protected createDatastream(
        id: string,
        stationLabel: string,
        sourceProperty: string,
        sourceUnit: string | undefined,
        sensorId: number | string,
        sensorName: string,
        sensorDescription: string,
        observations: STObservation[]
    ): STDatastream {
        const pollutant = getPollutant(sourceProperty, sourceUnit)

        return {
            '@iot.id': id,
            name: `${pollutant.name} at ${stationLabel}`,
            description: `${pollutant.description} measured at ${stationLabel}`,
            observationType: 'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement',
            unitOfMeasurement: {
                name: pollutant.unitName,
                symbol: pollutant.unit,
                definition: pollutant.unitDefinition
            },
            ObservedProperty: {
                '@iot.id': pollutant.id,
                name: pollutant.name,
                description: pollutant.description,
                definition: pollutant.definition
            },
            Sensor: {
                '@iot.id': sensorId,
                name: sensorName,
                description: sensorDescription,
                encodingType: 'application/pdf',
                metadata: ''
            },
            Observations: observations
        }
    }

    /**
     * Enriches observations with context for filtered responses
     */
    protected enrichObservations(things: STThing[]): EnrichedObservation[] {
        return things.flatMap(thing =>
            thing.Datastreams.flatMap(ds =>
                ds.Observations.map(obs => ({
                    ...obs,
                    observedProperty: ds.ObservedProperty.name,
                    observedPropertyId: ds.ObservedProperty['@iot.id'],
                    unit: ds.unitOfMeasurement.symbol,
                    stationId: thing['@iot.id'],
                    stationName: thing.name,
                    location: thing.Locations[0]?.location,
                    'Datastream@iot.navigationLink': `${this.baseUrl}/Datastreams(${ds['@iot.id']})`
                }))
            )
        )
    }

    /**
     * Extracts all datastreams from things with navigation links
     */
    protected extractDatastreams(things: STThing[]): Array<STDatastream & { 'Thing@iot.navigationLink': string }> {
        return things.flatMap(thing =>
            thing.Datastreams.map(ds => ({
                ...ds,
                'Thing@iot.navigationLink': `${this.baseUrl}/Things(${thing['@iot.id']})`
            }))
        )
    }

    /**
     * Extracts unique observed properties from things
     */
    protected extractObservedProperties(things: STThing[]): Array<{
        '@iot.id': string
        '@iot.selfLink': string
        name: string
        description: string
        definition: string
    }> {
        const propsMap = new Map<string, STDatastream['ObservedProperty']>()
        for (const thing of things) {
            for (const ds of thing.Datastreams) {
                if (!propsMap.has(ds.ObservedProperty['@iot.id'])) {
                    propsMap.set(ds.ObservedProperty['@iot.id'], ds.ObservedProperty)
                }
            }
        }
        return Array.from(propsMap.values()).map(p => ({
            ...p,
            '@iot.selfLink': `${this.baseUrl}/ObservedProperties(${p['@iot.id']})`
        }))
    }
}


