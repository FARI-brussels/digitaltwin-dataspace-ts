import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Brussels Mobility traffic counts
 */
export class BrusselsMobilityTrafficCountsCollector extends Collector {
    private readonly endpoint = 'https://data.mobility.brussels/traffic/api/counts/?request=live'

    getConfiguration() {
        return {
            name: 'brussels_mobility_traffic_counts_collector',
            description: 'Collecte les comptages trafic en temps réel de Brussels Mobility',
            contentType: 'application/json',
            endpoint: 'api/brussels-mobility/traffic-counts',
            tags: ['Brussels', 'Mobility', 'Traffic', 'Counts']
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
