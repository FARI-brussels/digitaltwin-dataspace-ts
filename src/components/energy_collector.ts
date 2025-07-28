
import { Collector } from 'digitaltwin-core'
/**
 * Data collector for energy
 */
export class EnergyCollector extends Collector {
	getConfiguration() {
		return {
			name: 'energy',
			description: 'Data collector for energy',
			contentType: 'application/json',
			endpoint: 'api/energy',
			tags: []
		}
	}

	async collect(): Promise<Buffer> {
		const response = await fetch("http://api.el.sc.ulb.be/energy");
		if (!response.ok) { throw new Error('Error in response') }

		return Buffer.from(await response.arrayBuffer())
	}

	getSchedule(): string {
		return '0 */5 * * * *' // Every 5 minutes by default
	}
}