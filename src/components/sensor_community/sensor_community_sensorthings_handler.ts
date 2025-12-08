import { servableEndpoint } from 'digitaltwin-core'
import type { ComponentConfiguration, DataResponse } from 'digitaltwin-core'
import { SensorThingsHandler, type STThing, type STObservation } from '../sensorthings/sensorthings_handler.js'

interface SensorCommunityItem {
    id: number
    timestamp: string
    location: {
        id: number
        latitude: string
        longitude: string
        altitude: string
        country: string
        exact_location: number
        indoor: number
    }
    sensor: {
        id: number
        pin: string
        sensor_type: { id: number; name: string; manufacturer: string }
    }
    sensordatavalues: Array<{ id: number; value: string; value_type: string }>
}

/**
 * SensorThings handler for Sensor.Community air quality data
 */
export class SensorCommunitySensorThingsHandler extends SensorThingsHandler {
    protected readonly baseUrl = '/api/sensor-community/v1.1'
    protected readonly collectorName = 'sensor_community_collector'

    getConfiguration(): ComponentConfiguration {
        return {
            name: 'sensor_community_sensorthings',
            description: 'Sensor.Community data in SensorThings format',
            contentType: 'application/json',
            tags: ['Sensor Community', 'SensorThings', 'Air Quality']
        }
    }

    @servableEndpoint({ path: '/api/sensor-community/v1.1/Things', method: 'GET' })
    async getThings(): Promise<DataResponse> {
        const data = await this.getCollectorData<SensorCommunityItem>()
        if (!data) return this.errorResponse(404, 'No data available')
        return this.collectionResponse(this.transformToThings(data))
    }

    @servableEndpoint({ path: '/api/sensor-community/v1.1/Things/:id', method: 'GET' })
    async getThing({ id }: { id: string }): Promise<DataResponse> {
        const data = await this.getCollectorData<SensorCommunityItem>()
        if (!data) return this.errorResponse(404, 'No data available')

        const items = data.filter(item => item.location.id === parseInt(id))
        if (items.length === 0) return this.errorResponse(404, `Thing(${id}) not found`)

        return this.successResponse(this.transformToThings(items)[0])
    }

    @servableEndpoint({ path: '/api/sensor-community/v1.1/Datastreams', method: 'GET' })
    async getDatastreams(params: { property?: string }): Promise<DataResponse> {
        const data = await this.getCollectorData<SensorCommunityItem>()
        if (!data) return this.errorResponse(404, 'No data available')

        const datastreams = this.filterByProperty(
            this.extractDatastreams(this.transformToThings(data)),
            params.property
        )
        return this.collectionResponse(datastreams)
    }

    @servableEndpoint({ path: '/api/sensor-community/v1.1/Observations', method: 'GET' })
    async getObservations(params: { property?: string }): Promise<DataResponse> {
        const data = await this.getCollectorData<SensorCommunityItem>()
        if (!data) return this.errorResponse(404, 'No data available')

        const observations = this.filterByProperty(
            this.enrichObservations(this.transformToThings(data)),
            params.property
        )
        return this.collectionResponse(observations)
    }

    @servableEndpoint({ path: '/api/sensor-community/v1.1/ObservedProperties', method: 'GET' })
    async getObservedProperties(): Promise<DataResponse> {
        const data = await this.getCollectorData<SensorCommunityItem>()
        if (!data) return this.errorResponse(404, 'No data available')
        return this.collectionResponse(this.extractObservedProperties(this.transformToThings(data)))
    }

    protected transformToThings(items: SensorCommunityItem[]): STThing[] {
        // Group by location
        const groups = items.reduce((acc, item) => {
            const locId = item.location.id
            if (!acc[locId]) acc[locId] = []
            acc[locId].push(item)
            return acc
        }, {} as Record<number, SensorCommunityItem[]>)

        return Object.values(groups).map(group => this.createThing(group))
    }

    private createThing(items: SensorCommunityItem[]): STThing {
        const loc = items[0].location
        const datastreamMap = new Map<string, { sensor: SensorCommunityItem['sensor']; obs: STObservation[]; valueType: string }>()

        for (const item of items) {
            for (const sv of item.sensordatavalues) {
                const dsId = `${loc.id}-${item.sensor.id}-${sv.value_type}`
                if (!datastreamMap.has(dsId)) {
                    datastreamMap.set(dsId, { sensor: item.sensor, obs: [], valueType: sv.value_type })
                }
                datastreamMap.get(dsId)!.obs.push({
                    '@iot.id': sv.id,
                    phenomenonTime: item.timestamp.replace(' ', 'T') + '.000Z',
                    resultTime: item.timestamp.replace(' ', 'T') + '.000Z',
                    result: parseFloat(sv.value)
                })
            }
        }

        return {
            '@iot.id': loc.id,
            '@iot.selfLink': `${this.baseUrl}/Things(${loc.id})`,
            name: `Sensor.Community Station ${loc.id}`,
            description: 'Citizen science air quality monitoring station',
            properties: { country: loc.country, indoor: loc.indoor === 1, source: 'sensor.community' },
            Locations: [{
                '@iot.id': loc.id,
                name: `Location ${loc.id} (${loc.country})`,
                description: `Location of station ${loc.id}`,
                encodingType: 'application/geo+json',
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(loc.longitude), parseFloat(loc.latitude), parseFloat(loc.altitude) || 0]
                }
            }],
            Datastreams: Array.from(datastreamMap.entries()).map(([dsId, { sensor, obs, valueType }]) =>
                this.createDatastream(
                    dsId,
                    `Station ${loc.id}`,
                    valueType,
                    undefined,
                    sensor.id,
                    sensor.sensor_type.name,
                    `${sensor.sensor_type.manufacturer} ${sensor.sensor_type.name}`,
                    obs
                )
            )
        }
    }
}
