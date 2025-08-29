import { Collector } from 'digitaltwin-core'

/**
 * Data collector for STIB GTFS static data
 */
export class STIBGTFSCollector extends Collector {
    private readonly endpoint = 'https://stibmivb.opendatasoft.com/api/explore/v2.1/catalog/datasets/gtfs-files-production/alternative_exports/gtfszip/'

    getConfiguration() {
        return {
            name: 'stib_gtfs_collector',
            description: 'Collecte les données GTFS statiques de la STIB pour Bruxelles',
            contentType: 'application/zip',
            endpoint: 'api/stib/gtfs',
            tags: ['STIB', 'GTFS', 'Transport']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 0 * * * *' // Every hour
    }
}
