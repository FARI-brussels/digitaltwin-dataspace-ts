import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Dott geofencing zones
 */
export class DottGeofenceCollector extends Collector {
    private readonly endpoint = 'https://gbfs.api.ridedott.com/public/v2/brussels/geofencing_zones.json'

    getConfiguration() {
        return {
            name: 'dott_geofence_collector',
            description: 'Collecte les zones de géorepérage Dott à Bruxelles',
            contentType: 'application/json',
            endpoint: 'api/dott/geofence',
            tags: ['Dott', 'Geofence']
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
