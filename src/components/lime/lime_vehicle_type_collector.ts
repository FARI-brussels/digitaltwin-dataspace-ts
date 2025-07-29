import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Lime vehicle types
 */
export class LimeVehicleTypeCollector extends Collector {
    private readonly endpoint = 'https://data.lime.bike/api/partners/v2/gbfs/brussels/vehicle_types'

    getConfiguration() {
        return {
            name: 'lime_vehicle_type_collector',
            description: 'Collecte les types de véhicules Lime à Bruxelles',
            contentType: 'application/json',
            endpoint: 'api/lime/vehicle-type',
            tags: ['Lime', 'Vehicle', 'Type']
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
