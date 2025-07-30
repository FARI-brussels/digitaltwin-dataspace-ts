import { Collector } from 'digitaltwin-core'

/**
 * Data collector for TEC GTFS realtime data
 */
export class TECGTFSRealtimeCollector extends Collector {
    private readonly endpoint = 'https://gtfsrt.tectime.be/proto/RealTime/trips?key=DDEBFA42173D45C08E710C7E9DDE8BDE'

    getConfiguration() {
        return {
            name: 'tec_gtfs_realtime_collector',
            description: 'Collecte les données GTFS temps réel de TEC',
            contentType: 'application/x-protobuf',
            endpoint: 'api/tec/gtfs-realtime',
            tags: ['TEC', 'GTFS', 'Realtime']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 * * * * *' // Every minute
    }
}
