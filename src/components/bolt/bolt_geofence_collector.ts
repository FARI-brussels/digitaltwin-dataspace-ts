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
        return '0 0 * * * *' // Every hour
    }
}
