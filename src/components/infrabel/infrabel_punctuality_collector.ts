import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Infrabel punctuality data
 */
export class InfrabelPunctualityCollector extends Collector {
    private readonly endpoint = 'https://opendata.infrabel.be/api/explore/v2.1/catalog/datasets/ruwe-gegevens-van-stiptheid-d-1/exports/json?lang=fr&timezone=Europe%2FBerlin'

    getConfiguration() {
        return {
            name: 'infrabel_punctuality_collector',
            description: 'Collecte les données de ponctualité D-1 du réseau Infrabel (JSON)',
            contentType: 'application/json',
            endpoint: 'api/infrabel/punctuality',
            tags: ['Infrabel', 'JSON', 'Ponctualité']
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
