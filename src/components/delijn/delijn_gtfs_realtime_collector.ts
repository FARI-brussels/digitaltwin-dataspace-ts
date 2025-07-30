import { Collector } from 'digitaltwin-core'

/**
 * Data collector for De Lijn GTFS realtime data
 */
export class DeLijnGTFSRealtimeCollector extends Collector {
    private readonly endpoint = 'https://api.delijn.be/gtfs/v3/realtime?json=false&delay=true&canceled=true'

    getConfiguration() {
        return {
            name: 'delijn_gtfs_realtime_collector',
            description: 'Collecte les données GTFS temps réel de De Lijn',
            contentType: 'application/x-protobuf',
            endpoint: 'api/delijn/gtfs-realtime',
            tags: ['DeLijn', 'GTFS', 'Realtime']
        }
    }

    async collect(): Promise<Buffer> {
        const apiKey = process.env.DE_LIJN_API_KEY
        if (!apiKey) {
            throw new Error('DE_LIJN_API_KEY environment variable is required')
        }

        const response = await fetch(this.endpoint, {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey
            }
        })
        
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 * * * * *' // Every minute
    }
}
