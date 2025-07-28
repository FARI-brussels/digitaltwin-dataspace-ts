import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Pony vehicle types
 */
export class PonyVehicleTypeCollector extends Collector {
    private readonly endpoint = 'https://gbfs.getapony.com/v1/Brussels/en/vehicle_types.json'

    getConfiguration() {
        return {
            name: 'pony_vehicle_type_collector',
            description: 'Collecte les types de véhicules Pony à Bruxelles',
            contentType: 'application/json',
            endpoint: 'api/pony/vehicle-type',
            tags: ['Pony', 'Vehicle', 'Type']
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
