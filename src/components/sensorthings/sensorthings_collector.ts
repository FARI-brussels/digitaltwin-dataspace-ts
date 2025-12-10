import { Collector } from 'digitaltwin-core'
import type { STThing, STDatastream, STObservation } from './types.js'
import { getPollutant } from './pollutants.js'

/**
 * Abstract base class for collectors that output OGC SensorThings format
 *
 * Subclasses implement:
 * - fetchRawData(): Fetch data from the source API
 * - transformToThings(): Transform raw data to SensorThings Things
 *
 * The collect() method handles the pipeline: fetch -> transform -> serialize
 */
export abstract class SensorThingsCollector extends Collector {
    /**
     * Fetches raw data from the external source
     */
    protected abstract fetchRawData(): Promise<unknown[]>

    /**
     * Transforms raw source data to SensorThings Things
     */
    protected abstract transformToThings(rawData: unknown[]): STThing[]

    /**
     * Template method: fetches, transforms, and serializes data
     */
    async collect(): Promise<Buffer> {
        const rawData = await this.fetchRawData()
        const things = this.transformToThings(rawData)
        return Buffer.from(JSON.stringify(things), 'utf-8')
    }

    /**
     * Helper: Creates a Datastream with standardized pollutant ontology
     */
    protected createDatastream(
        id: string,
        stationLabel: string,
        propertyName: string,
        propertyUnit: string | undefined,
        sensorId: string | number,
        sensorName: string,
        observations: STObservation[]
    ): STDatastream {
        const pollutant = getPollutant(propertyName, propertyUnit)

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
                description: sensorName,
                encodingType: 'application/pdf',
                metadata: ''
            },
            Observations: observations
        }
    }

    /**
     * Helper: Creates an Observation
     */
    protected createObservation(
        id: string | number,
        timestamp: string | number,
        value: number
    ): STObservation {
        const isoTime = typeof timestamp === 'number'
            ? new Date(timestamp).toISOString()
            : timestamp.includes('T') ? timestamp : `${timestamp.replace(' ', 'T')}.000Z`

        return {
            '@iot.id': id,
            phenomenonTime: isoTime,
            resultTime: isoTime,
            result: value
        }
    }
}
