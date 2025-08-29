import { Collector } from 'digitaltwin-core'

/**
 * Data collector for SNCB GTFS static data
 */
export class SNCBGTFSStaticCollector extends Collector {
    private readonly endpoint = 'https://sncb-opendata.hafas.de/gtfs/static/c21ac6758dd25af84cca5b707f3cb3de'

    getConfiguration() {
        return {
            name: 'sncb_gtfs_static_collector',
            description: 'Collecte les données GTFS statiques de la SNCB',
            contentType: 'application/zip',
            endpoint: 'api/sncb/gtfs-static',
            tags: ['SNCB', 'GTFS']
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
