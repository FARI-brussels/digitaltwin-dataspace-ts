import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Infrabel segments
 */
export class InfrabelSegmentsCollector extends Collector {
    private readonly endpoint = 'https://infrabel.opendatasoft.com/api/explore/v2.1/catalog/datasets/station_to_station/exports/geojson?lang=fr&timezone=Europe%2FBerlin'

    getConfiguration() {
        return {
            name: 'infrabel_segments_collector',
            description: 'Collecte les segments station à station du réseau Infrabel (GeoJSON)',
            contentType: 'application/geo+json',
            endpoint: 'api/infrabel/segments',
            tags: ['Infrabel', 'GeoJSON', 'Segments']
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
