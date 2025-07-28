import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Pony geofencing zones
 */
export class PonyGeofenceCollector extends Collector {
    private readonly endpoint = 'https://gbfs.getapony.com/v1/Brussels/en/geofencing_zones.json'

    getConfiguration() {
        return {
            name: 'pony_geofence_collector',
            description: 'Collecte les zones de géorepérage Pony à Bruxelles',
            contentType: 'application/json',
            endpoint: 'api/pony/geofence',
            tags: ['Pony', 'Geofence']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 */10 * * * *' // Every 10 minutes
    }
}
