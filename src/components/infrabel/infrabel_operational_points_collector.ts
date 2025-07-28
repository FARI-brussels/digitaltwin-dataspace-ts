import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Infrabel operational points
 */
export class InfrabelOperationalPointsCollector extends Collector {
    private readonly endpoint = 'https://opendata.infrabel.be/api/explore/v2.1/catalog/datasets/operationele-punten-van-het-netwerk/exports/geojson?lang=fr&timezone=Europe%2FBerlin'

    getConfiguration() {
        return {
            name: 'infrabel_operational_points_collector',
            description: 'Collecte les points opérationnels du réseau Infrabel (GeoJSON)',
            contentType: 'application/geo+json',
            endpoint: 'api/infrabel/operational-points',
            tags: ['Infrabel', 'GeoJSON', 'Points opérationnels']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 */10 * * * *' // Every 10 minutes
    }
}
