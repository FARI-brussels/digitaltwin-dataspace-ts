import { SensorThingsCollector } from '../sensorthings/sensorthings_collector.js'
import type { STThing } from '../sensorthings/types.js'

/**
 * Raw IRCELINE API response item
 */
interface IrcelineRawItem {
    id: string
    label: string
    uom: string
    station: {
        id: number
        label: string
        geometry: {
            coordinates: [number, number]
        }
    }
    lastValue: {
        timestamp: number
        value: number
    } | null
    parameters: {
        phenomenon: { id: string; label: string }
        procedure: { id: string; label: string }
        category: { id: string; label: string }
    }
}

/**
 * IRCELINE air quality data collector
 * Fetches data from Belgian Interregional Environment Agency and outputs SensorThings format
 *
 * @see https://geo.irceline.be/sos/api/v1/
 */
export class IrcelineCollector extends SensorThingsCollector {
    private readonly apiUrl = 'https://geo.irceline.be/sos/api/v1/timeseries/?expanded=true'

    getConfiguration() {
        return {
            name: 'irceline',
            description: 'IRCELINE air quality data (SensorThings format)',
            contentType: 'application/json',
            endpoint: 'api/irceline',
            tags: ['IRCELINE', 'Air Quality', 'Belgium', 'SensorThings']
        }
    }

    getSchedule(): string {
        return '0 */5 * * * *' // Every 5 minutes
    }

    protected async fetchRawData(): Promise<IrcelineRawItem[]> {
        const response = await fetch(this.apiUrl)
        if (!response.ok) {
            throw new Error(`IRCELINE API error: ${response.status}`)
        }
        return response.json()
    }

    protected transformToThings(rawData: IrcelineRawItem[]): STThing[] {
        // Group items by station
        const stationGroups = new Map<number, IrcelineRawItem[]>()

        for (const item of rawData) {
            if (!item.station) continue
            const stationId = item.station.id
            if (!stationGroups.has(stationId)) {
                stationGroups.set(stationId, [])
            }
            stationGroups.get(stationId)!.push(item)
        }

        // Transform each station group to a Thing
        return Array.from(stationGroups.entries()).map(([stationId, items]) =>
            this.createThing(stationId, items)
        )
    }

    private createThing(stationId: number, items: IrcelineRawItem[]): STThing {
        const station = items[0].station
        const [lon, lat] = station.geometry?.coordinates || [0, 0]

        return {
            '@iot.id': `irceline-${stationId}`,
            name: station.label,
            description: `IRCELINE monitoring station: ${station.label}`,
            properties: {
                source: 'irceline',
                network: 'Belgian Interregional Environment Agency',
                originalId: stationId
            },
            Locations: [{
                '@iot.id': `irceline-loc-${stationId}`,
                name: station.label,
                description: `Location of ${station.label}`,
                encodingType: 'application/geo+json',
                location: {
                    type: 'Point',
                    coordinates: [lon, lat]
                }
            }],
            Datastreams: items
                .filter(item => item.lastValue !== null)
                .map(item => this.createDatastream(
                    `irceline-ds-${item.id}`,
                    station.label,
                    item.parameters.phenomenon.label,
                    item.uom,
                    item.parameters.procedure.id,
                    item.parameters.procedure.label,
                    item.lastValue ? [
                        this.createObservation(
                            `irceline-obs-${item.id}`,
                            item.lastValue.timestamp,
                            item.lastValue.value
                        )
                    ] : []
                ))
        }
    }
}
