/**
 * OGC SensorThings API data model types
 * @see https://docs.ogc.org/is/18-088/18-088.html
 */

export interface STLocation {
    '@iot.id': string | number
    name: string
    description: string
    encodingType: 'application/geo+json'
    location: {
        type: 'Point'
        coordinates: [number, number] | [number, number, number]
    }
}

export interface STObservation {
    '@iot.id': string | number
    phenomenonTime: string
    resultTime: string
    result: number
}

export interface STObservedProperty {
    '@iot.id': string
    name: string
    description: string
    definition: string
}

export interface STSensor {
    '@iot.id': string | number
    name: string
    description: string
    encodingType: string
    metadata: string
}

export interface STUnitOfMeasurement {
    name: string
    symbol: string
    definition: string
}

export interface STDatastream {
    '@iot.id': string
    name: string
    description: string
    observationType: string
    unitOfMeasurement: STUnitOfMeasurement
    ObservedProperty: STObservedProperty
    Sensor: STSensor
    Observations: STObservation[]
}

export interface STThing {
    '@iot.id': string | number
    name: string
    description: string
    properties: Record<string, unknown>
    Locations: STLocation[]
    Datastreams: STDatastream[]
}

/**
 * Collection wrapper for SensorThings responses
 */
export interface STCollection<T> {
    '@iot.count': number
    value: T[]
}
