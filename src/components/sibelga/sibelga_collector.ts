import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Sibelga construction work data
 */
export class SibelgaCollector extends Collector {
    private readonly endpoint = 'https://www.sibelga.be/fr/chantiers-data/data'

    getConfiguration() {
        return {
            name: 'sibelga_collector',
            description: 'Collects data from Sibelga APIs',
            contentType: 'application/json',
            endpoint: 'api/sibelga',
            tags: ['Sibelga']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        
        const data = await response.json()
        const items = data.items || []

        const features = items
            .filter((item: any) => item.latitude !== null && item.longitude !== null)
            .map((item: any) => {
                const { latitude, longitude, ...properties } = item
                
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    properties
                }
            })

        const geojson = {
            type: 'FeatureCollection',
            features
        }

        return Buffer.from(JSON.stringify(geojson), 'utf-8')
    }

    getSchedule(): string {
        return '0 0 * * * *' // Every hour
    }
}
