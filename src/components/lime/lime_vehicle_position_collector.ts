import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Lime vehicle positions
 */
export class LimeVehiclePositionCollector extends Collector {
    private readonly endpoint = 'https://data.lime.bike/api/partners/v2/gbfs/brussels/free_bike_status'

    getConfiguration() {
        return {
            name: 'lime_vehicle_position_collector',
            description: 'Collecte les positions des véhicules Lime à Bruxelles',
            contentType: 'application/geo+json',
            endpoint: 'api/lime/vehicle-position',
            tags: ['Lime', 'Vehicle', 'Position']
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
                properties,
                id: bike.bike_id || bike.id
            }
        })

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
