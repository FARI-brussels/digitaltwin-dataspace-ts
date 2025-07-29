import { Collector } from 'digitaltwin-core'

/**
 * Data collector for De Lijn GTFS static data
 */
export class DeLijnGTFSStaticCollector extends Collector {
    private readonly endpoint = 'https://gtfs.irail.be/de-lijn/de_lijn-gtfs.zip'

    getConfiguration() {
        return {
            name: 'delijn_gtfs_static_collector',
            description: 'Collecte les données GTFS statiques de De Lijn',
            contentType: 'application/zip',
            endpoint: 'api/delijn/gtfs-static',
            tags: ['DeLijn', 'GTFS', 'Static']
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
