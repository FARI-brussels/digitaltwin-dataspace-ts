import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Telraam traffic data
 */
export class TelraamTrafficCollector extends Collector {
    private readonly endpoint = 'https://telraam-api.net/v1/reports/traffic_snapshot_live'

    getConfiguration() {
        return {
            name: 'telraam_traffic_collector',
            description: 'Collecte les données de trafic en temps réel depuis l\'API Telraam',
            contentType: 'application/json',
            endpoint: 'api/telraam/traffic',
            tags: ['Telraam', 'Traffic', 'API']
        }
    }

    async collect(): Promise<Buffer> {
        const apiKey = process.env.TELRAAM_API_KEY
        if (!apiKey) {
            throw new Error('TELRAAM_API_KEY environment variable is required')
        }

        const response = await fetch(this.endpoint, {
            headers: {
                'X-Api-Key': apiKey
            }
        })
        
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 0 * * * *' // Every hour
    }
}
