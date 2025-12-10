import { SensorThingsCollector } from '../sensorthings/sensorthings_collector.js'
import type { STThing, STObservation } from '../sensorthings/types.js'

/**
 * Raw Sensor.Community API response item
 */
interface SensorCommunityRawItem {
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
        sensor_type: {
            id: number
            name: string
            manufacturer: string
        }
    }
    sensordatavalues: Array<{
        id: number
        value: string
        value_type: string
    }>
}

/**
 * Sensor.Community air quality data collector
 * Fetches citizen science air quality data and outputs SensorThings format
 *
 * @see https://sensor.community/
 */
export class SensorCommunityCollector extends SensorThingsCollector {
    // Brussels area: 10km radius around city center
    private readonly apiUrl = 'https://data.sensor.community/airrohr/v1/filter/area=50.8503,4.3517,10'

    getConfiguration() {
        return {
            name: 'sensor_community',
            description: 'Sensor.Community air quality data (SensorThings format)',
            contentType: 'application/json',
            endpoint: 'api/sensor-community',
            tags: ['Sensor Community', 'Air Quality', 'Citizen Science', 'SensorThings']
        }
    }

    getSchedule(): string {
        return '0 */5 * * * *' // Every 5 minutes
    }

    protected async fetchRawData(): Promise<SensorCommunityRawItem[]> {
        const response = await fetch(this.apiUrl)
        if (!response.ok) {
            throw new Error(`Sensor.Community API error: ${response.status}`)
        }
        return response.json()
    }

    protected transformToThings(rawData: SensorCommunityRawItem[]): STThing[] {
        // Filter invalid locations and group by location ID
        const locationGroups = new Map<number, SensorCommunityRawItem[]>()

        for (const item of rawData) {
            if (!item.location || !item.location.latitude || !item.location.longitude) continue

            const locId = item.location.id
            if (!locationGroups.has(locId)) {
                locationGroups.set(locId, [])
            }
            locationGroups.get(locId)!.push(item)
        }

        // Transform each location group to a Thing
        return Array.from(locationGroups.entries()).map(([locId, items]) =>
            this.createThing(locId, items)
        )
    }

    private createThing(locationId: number, items: SensorCommunityRawItem[]): STThing {
        const loc = items[0].location

        // Aggregate datastreams from all measurements at this location
        // Key: sensor_id-value_type for unique datastreams
        const datastreamMap = new Map<string, {
            sensor: SensorCommunityRawItem['sensor']
            observations: STObservation[]
            valueType: string
        }>()

        for (const item of items) {
            for (const sv of item.sensordatavalues) {
                const dsKey = `${item.sensor.id}-${sv.value_type}`

                if (!datastreamMap.has(dsKey)) {
                    datastreamMap.set(dsKey, {
                        sensor: item.sensor,
                        observations: [],
                        valueType: sv.value_type
                    })
                }

                datastreamMap.get(dsKey)!.observations.push(
                    this.createObservation(sv.id, item.timestamp, parseFloat(sv.value))
                )
            }
        }

        return {
            '@iot.id': `sc-${locationId}`,
            name: `Sensor.Community Station ${locationId}`,
            description: 'Citizen science air quality monitoring station',
            properties: {
                source: 'sensor.community',
                country: loc.country,
                indoor: loc.indoor === 1,
                exactLocation: loc.exact_location === 1,
                originalId: locationId
            },
            Locations: [{
                '@iot.id': `sc-loc-${locationId}`,
                name: `Location ${locationId} (${loc.country})`,
                description: `Location of Sensor.Community station ${locationId}`,
                encodingType: 'application/geo+json',
                location: {
                    type: 'Point',
                    coordinates: [
                        parseFloat(loc.longitude),
                        parseFloat(loc.latitude),
                        parseFloat(loc.altitude) || 0
                    ]
                }
            }],
            Datastreams: Array.from(datastreamMap.entries()).map(([dsKey, data]) =>
                this.createDatastream(
                    `sc-ds-${dsKey}`,
                    `Station ${locationId}`,
                    data.valueType,
                    undefined,
                    data.sensor.id,
                    `${data.sensor.sensor_type.manufacturer} ${data.sensor.sensor_type.name}`,
                    data.observations
                )
            )
        }
    }
}
