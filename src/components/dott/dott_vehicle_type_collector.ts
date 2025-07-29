import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Dott vehicle types
 */
export class DottVehicleTypeCollector extends Collector {
    private readonly endpoint = 'https://gbfs.api.ridedott.com/public/v2/brussels/vehicle_types.json'

    getConfiguration() {
        return {
            name: 'dott_vehicle_type_collector',
            description: 'Collecte les types de véhicules Dott à Bruxelles',
            contentType: 'application/json',
            endpoint: 'api/dott/vehicle-type',
            tags: ['Dott', 'Vehicle', 'Type']
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
