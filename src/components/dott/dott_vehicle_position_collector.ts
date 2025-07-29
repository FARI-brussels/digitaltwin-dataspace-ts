import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Dott vehicle positions
 */
export class DottVehiclePositionCollector extends Collector {
    private readonly endpoint = 'https://gbfs.api.ridedott.com/public/v2/brussels/free_bike_status.json'

    getConfiguration() {
        return {
            name: 'dott_vehicle_position_collector',
            description: 'Collecte les positions des véhicules Dott à Bruxelles',
            contentType: 'application/geo+json',
            endpoint: 'api/dott/vehicle-position',
            tags: ['Dott', 'Vehicle', 'Position']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        
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
    }

    getSchedule(): string {
        return '0 * * * * *' // Every minute
    }
}
