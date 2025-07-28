
import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Bolt geofencing zones
 */
export class BoltGeofenceCollector extends Collector {
    getConfiguration() {
        return {
            name: 'bolt_geofence_collector',
            description: 'Collecte les zones de géorepérage Bolt à Bruxelles',
            contentType: 'application/json',
            endpoint: 'api/bolt/geofence',
            tags: ['Bolt', 'Geofence']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch("https://mds.bolt.eu/gbfs/2/336/geofencing_zones")
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 */10 * * * *' // Every 10 minutes
    }
}

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
            // Extract properties excluding lat, lon, rental_uris
            const properties: any = {}
            for (const [key, value] of Object.entries(bike)) {
                if (!['lat', 'lon', 'rental_uris'].includes(key)) {
                    properties[key] = value
                }
            }

            // Add rental_uris properly if it exists
            if (bike.rental_uris) {
                properties.rental_uris = bike.rental_uris
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

/**
 * Data collector for Bolt vehicle types
 */
export class BoltVehicleTypeCollector extends Collector {
    getConfiguration() {
        return {
            name: 'bolt_vehicle_type_collector',
            description: 'Collecte les types de véhicules Bolt à Bruxelles',
            contentType: 'application/json',
            endpoint: 'api/bolt/vehicle-type',
            tags: ['Bolt', 'Vehicle', 'Type']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch("https://mds.bolt.eu/gbfs/2/336/vehicle_types")
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 */10 * * * *' // Every 10 minutes
    }
}