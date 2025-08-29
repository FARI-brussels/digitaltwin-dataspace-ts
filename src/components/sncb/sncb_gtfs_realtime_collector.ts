import { Collector } from 'digitaltwin-core'

/**
 * Data collector for SNCB GTFS realtime data
 */
export class SNCBGTFSRealtimeCollector extends Collector {
    private readonly endpoint = 'https://sncb-opendata.hafas.de/gtfs/realtime/c21ac6758dd25af84cca5b707f3cb3de'

    getConfiguration() {
        return {
            name: 'sncb_gtfs_realtime_collector',
            description: 'Collecte les données GTFS temps réel de la SNCB',
            contentType: 'application/x-protobuf',
            endpoint: 'api/sncb/gtfs-realtime',
            tags: ['SNCB', 'GTFS', 'realtime']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (response.status >= 500) {
            throw new Error('SNCB gtfs realtime is down.')
        }
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 0 * * * *' // Every hour
    }
}
