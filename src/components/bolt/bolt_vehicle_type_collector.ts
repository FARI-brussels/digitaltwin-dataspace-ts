import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Bolt vehicle types
 */
export class BoltVehicleTypeCollector extends Collector {
    getConfiguration() {
        return {
            name: 'bolt_vehicle_type_collector',
            description: 'Collecte les types de véhicules Bolt à Bruxelles',
            contentType: 'application/json',
            endpoint: 'api/bolt/vehicle-type',
            tags: ['Bolt', 'Vehicle', 'Type']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch("https://mds.bolt.eu/gbfs/2/336/vehicle_types")
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 0 * * * *' // Every hour
    }
}
