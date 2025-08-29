import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Infrabel line sections
 */
export class InfrabelLineSectionCollector extends Collector {
    private readonly endpoint = 'https://opendata.infrabel.be/api/explore/v2.1/catalog/datasets/geosporen/exports/geojson?lang=fr&timezone=Europe%2FBerlin'

    getConfiguration() {
        return {
            name: 'infrabel_line_section_collector',
            description: 'Collecte les sections de lignes du réseau Infrabel (GeoJSON)',
            contentType: 'application/geo+json',
            endpoint: 'api/infrabel/line-sections',
            tags: ['Infrabel', 'GeoJSON', 'Lignes']
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
