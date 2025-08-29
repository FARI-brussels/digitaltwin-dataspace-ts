import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Pony vehicle positions
 */
export class PonyVehiclePositionCollector extends Collector {
    private readonly endpoint = 'https://gbfs.getapony.com/v1/Brussels/en/free_bike_status.json'

    getConfiguration() {
        return {
            name: 'pony_vehicle_position_collector',
            description: 'Collecte les positions des véhicules Pony à Bruxelles',
            contentType: 'application/geo+json',
            endpoint: 'api/pony/vehicle-position',
            tags: ['Pony', 'Vehicle', 'Position']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        
        try {
            const responseJson = await response.json()
            const bikes = responseJson.data.bikes

            const features = bikes.map((bike: any) => {
                // Extract properties excluding lat, lon
                const properties: any = {}
                for (const [key, value] of Object.entries(bike)) {
                    if (!['lat', 'lon'].includes(key)) {
                        properties[key] = value
                    }
                }

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [bike.lon, bike.lat]
                    },
                    properties
                }
            })

            const geojson = {
                type: 'FeatureCollection',
                features
            }

            return Buffer.from(JSON.stringify(geojson), 'utf-8')
        } catch (error) {
            throw new Error('Pony API is not available, returned: ' + await response.text())
        }
    }

    getSchedule(): string {
        return '0 0 * * * *' // Every hour
    }
}
