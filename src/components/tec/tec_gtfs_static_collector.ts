import { Collector } from 'digitaltwin-core'

/**
 * Data collector for TEC GTFS static data
 */
export class TECGTFSStaticCollector extends Collector {
    private readonly endpoint = 'https://opendata.tec-wl.be/Current%20GTFS/TEC-GTFS.zip'

    getConfiguration() {
        return {
            name: 'tec_gtfs_static_collector',
            description: 'Collecte les données GTFS statiques de TEC',
            contentType: 'application/zip',
            endpoint: 'api/tec/gtfs-static',
            tags: ['TEC', 'GTFS', 'Static']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 */30 * * * *' // Every 30 minutes
    }
}
