import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Bolt vehicle positions
 */
export class BoltVehiclePositionCollector extends Collector {
    getConfiguration() {
        return {
            name: 'bolt_vehicle_position_collector',
            description: 'Collecte les positions des véhicules Bolt à Bruxelles',
            contentType: 'application/geo+json',
            endpoint: 'api/bolt/vehicle-position',
            tags: ['Bolt', 'Vehicle', 'Position']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch("https://mds.bolt.eu/gbfs/2/336/free_bike_status")
        if (!response.ok) { throw new Error('Error in response') }
        const responseJson = await response.json()
        const bikes = responseJson.data.bikes

        const features = bikes.map((bike: any) => {
            // Extract properties excluding lat, lon
            const properties: any = {}
            for (const [key, value] of Object.entries(bike)) {
                if (key != 'lat' && key != 'lon') {
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
