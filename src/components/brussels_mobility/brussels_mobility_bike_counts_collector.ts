import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Brussels Mobility bike counts
 */
export class BrusselsMobilityBikeCountsCollector extends Collector {
    private readonly endpoint = 'https://data.mobility.brussels/bike/api/counts/?request=live'

    getConfiguration() {
        return {
            name: 'brussels_mobility_bike_counts_collector',
            description: 'Collecte les comptages vélo en temps réel de Brussels Mobility',
            contentType: 'application/json',
            endpoint: 'api/brussels-mobility/bike-counts',
            tags: ['Brussels', 'Mobility', 'Bike', 'Counts']
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
