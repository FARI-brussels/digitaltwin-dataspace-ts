import { Collector } from 'digitaltwin-core'

/**
 * Data collector for IRCELINE air quality data (Belgian Interregional Environment Agency)
 * Stores raw data in compact format for efficient storage
 * Use IrcelineSensorThingsHandler to get SensorThings API format
 * 
 * @see https://geo.irceline.be/sos/api/v1/
 */
export class IrcelineSosCollector extends Collector {
    private readonly endpoint = 'https://geo.irceline.be/sos/api/v1/timeseries/?expanded=true'

    getConfiguration() {
        return {
            name: 'irceline_sos',
            description: 'Collects raw data from IRCELINE SOS API (Belgian air quality)',
            contentType: 'application/json',
            endpoint: 'api/irceline_sos',
            tags: ['IRCELINE', 'Air Quality', 'Belgium']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }

        const data = await response.json()

        // Store compact version - strip large unused fields (referenceValues, extras, statusIntervals)
        // Keep only essential data for SensorThings transformation
        const compactData = data
            .filter((item: any) => item.station?.geometry?.coordinates)
            .map((item: any) => ({
                id: item.id,
                label: item.label,
                uom: item.uom,
                station: {
                    id: item.station.properties?.id,
                    label: item.station.properties?.label,
                    coordinates: item.station.geometry.coordinates
                },
                lastValue: item.lastValue,
                parameters: {
                    phenomenon: item.parameters?.phenomenon,
                    procedure: item.parameters?.procedure,
                    category: item.parameters?.category
                }
            }))

        return Buffer.from(JSON.stringify(compactData), 'utf-8')
    }

    getSchedule(): string {
        return '0 */5 * * * *' // Every 5 minutes (IRCELINE updates less frequently)
    }
}