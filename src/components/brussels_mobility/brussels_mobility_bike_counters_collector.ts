import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Brussels Mobility bike counters metadata
 */
export class BrusselsMobilityBikeCountersCollector extends Collector {
    private readonly endpoint = 'https://data.mobility.brussels/bike/api/counts/?request=devices'

    getConfiguration() {
        return {
            name: 'brussels_mobility_bike_counters_collector',
            description: 'Collecte les métadonnées des compteurs vélo de Brussels Mobility',
            contentType: 'application/json',
            endpoint: 'api/brussels-mobility/bike-counters',
            tags: ['Brussels', 'Mobility', 'Bike', 'Counters']
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
