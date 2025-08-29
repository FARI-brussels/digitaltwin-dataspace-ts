import { Collector } from 'digitaltwin-core'

/**
 * Data collector for STIB shapefiles
 */
export class STIBShapeFilesCollector extends Collector {
    private readonly endpoint = 'https://stibmivb.opendatasoft.com/api/explore/v2.1/catalog/datasets/shapefiles-production/exports/geojson'

    getConfiguration() {
        return {
            name: 'stib_shapefiles_collector',
            description: 'Collecte les shapefiles du réseau STIB en format GeoJSON',
            contentType: 'application/geo+json',
            endpoint: 'api/stib/shapefiles',
            tags: ['STIB', 'GeoJSON', 'Shapefiles']
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
