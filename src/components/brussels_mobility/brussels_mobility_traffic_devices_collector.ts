import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Brussels Mobility traffic devices metadata
 */
export class BrusselsMobilityTrafficDevicesCollector extends Collector {
    private readonly endpoint = 'https://data.mobility.brussels/traffic/api/counts/?request=devices'

    getConfiguration() {
        return {
            name: 'brussels_mobility_traffic_devices_collector',
            description: 'Collecte les métadonnées des compteurs trafic de Brussels Mobility',
            contentType: 'application/json',
            endpoint: 'api/brussels-mobility/traffic-devices',
            tags: ['Brussels', 'Mobility', 'Traffic', 'Devices']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        return Buffer.from(await response.arrayBuffer())
    }

    getSchedule(): string {
        return '0 * * * * *' // Every minute
    }
}
