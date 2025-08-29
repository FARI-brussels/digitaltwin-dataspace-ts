import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Sensor Community air quality data
 */
export class SensorCommunityCollector extends Collector {
    private readonly endpoint = 'https://data.sensor.community/airrohr/v1/filter/area=50.8503,4.3517,10'

    getConfiguration() {
        return {
            name: 'sensor_community_collector',
            description: 'Collects data from Sensor Community APIs',
            contentType: 'application/json',
            endpoint: 'api/sensor-community',
            tags: ['Sensor Community']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        
        const data = await response.json()
        
        const features = data
            .filter((item: any) => item.location && item.location.longitude !== null && item.location.latitude !== null)
            .map((item: any) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [item.location.longitude, item.location.latitude]
                },
                properties: {
                    sensordatavalues: item.sensordatavalues || [],
                    id: item.id,
                    timestamp: item.timestamp,
                    sensor: item.sensor,
                    location: {
                        id: item.location.id,
                        exact: {
                            location: item.location.exact_location
                        },
                        indoor: item.location.indoor
                    }
                },
                id: item.id
            }))

        const geojson = {
            type: 'FeatureCollection',
            features
        }

        return Buffer.from(JSON.stringify(geojson), 'utf-8')
    }

    getSchedule(): string {
        return '0 0 * * * *' // Every hour
    }
}
