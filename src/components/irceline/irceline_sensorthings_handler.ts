import { servableEndpoint } from 'digitaltwin-core'
import type { ComponentConfiguration, DataResponse } from 'digitaltwin-core'
import { SensorThingsHandler, type STThing, type STObservation } from '../sensorthings/sensorthings_handler.js'

interface IrcelineItem {
    id: string
    label: string
    uom: string
    station: { id: number; label: string; coordinates: [number, number, string | number] }
    lastValue: { timestamp: number; value: number } | null
    parameters: {
        phenomenon: { id: string; label: string }
        procedure: { id: string; label: string }
        category: { id: string; label: string }
    }
}

/**
 * SensorThings handler for IRCELINE air quality data
 */
export class IrcelineSensorThingsHandler extends SensorThingsHandler {
    protected readonly baseUrl = '/api/irceline/v1.1'
    protected readonly collectorName = 'irceline_sos'

    getConfiguration(): ComponentConfiguration {
        return {
            name: 'irceline_sensorthings',
            description: 'IRCELINE data in SensorThings format',
            contentType: 'application/json',
            tags: ['IRCELINE', 'SensorThings', 'Air Quality', 'Belgium']
        }
    }

    @servableEndpoint({ path: '/api/irceline/v1.1/Things', method: 'GET' })
    async getThings(): Promise<DataResponse> {
        const data = await this.getCollectorData<IrcelineItem>()
        if (!data) return this.errorResponse(404, 'No data available')
        return this.collectionResponse(this.transformToThings(data))
    }

    @servableEndpoint({ path: '/api/irceline/v1.1/Things/:id', method: 'GET' })
    async getThing({ id }: { id: string }): Promise<DataResponse> {
        const data = await this.getCollectorData<IrcelineItem>()
        if (!data) return this.errorResponse(404, 'No data available')

        const items = data.filter(item => item.station.id === parseInt(id))
        if (items.length === 0) return this.errorResponse(404, `Thing(${id}) not found`)

        return this.successResponse(this.transformToThings(items)[0])
    }

    @servableEndpoint({ path: '/api/irceline/v1.1/Datastreams', method: 'GET' })
    async getDatastreams(params: { property?: string }): Promise<DataResponse> {
        const data = await this.getCollectorData<IrcelineItem>()
        if (!data) return this.errorResponse(404, 'No data available')

        const datastreams = this.filterByProperty(
            this.extractDatastreams(this.transformToThings(data)),
            params.property
        )
        return this.collectionResponse(datastreams)
    }

    @servableEndpoint({ path: '/api/irceline/v1.1/Observations', method: 'GET' })
    async getObservations(params: { property?: string }): Promise<DataResponse> {
        const data = await this.getCollectorData<IrcelineItem>()
        if (!data) return this.errorResponse(404, 'No data available')

        const observations = this.filterByProperty(
            this.enrichObservations(this.transformToThings(data)),
            params.property
        )
        return this.collectionResponse(observations)
    }

    @servableEndpoint({ path: '/api/irceline/v1.1/ObservedProperties', method: 'GET' })
    async getObservedProperties(): Promise<DataResponse> {
        const data = await this.getCollectorData<IrcelineItem>()
        if (!data) return this.errorResponse(404, 'No data available')
        return this.collectionResponse(this.extractObservedProperties(this.transformToThings(data)))
    }

    protected transformToThings(items: IrcelineItem[]): STThing[] {
        // Group by station
        const groups = items.reduce((acc, item) => {
            const stationId = item.station.id
            if (!acc[stationId]) acc[stationId] = []
            acc[stationId].push(item)
            return acc
        }, {} as Record<number, IrcelineItem[]>)

        return Object.values(groups).map(group => this.createThing(group))
    }

    private createThing(items: IrcelineItem[]): STThing {
        const station = items[0].station
        const [lon, lat] = station.coordinates

        return {
            '@iot.id': station.id,
            '@iot.selfLink': `${this.baseUrl}/Things(${station.id})`,
            name: station.label,
            description: `IRCELINE monitoring station: ${station.label}`,
            properties: { source: 'irceline', network: 'Belgian Interregional Environment Agency' },
            Locations: [{
                '@iot.id': station.id,
                name: station.label,
                description: `Location of ${station.label}`,
                encodingType: 'application/geo+json',
                location: { type: 'Point', coordinates: [parseFloat(String(lon)), parseFloat(String(lat))] }
            }],
            Datastreams: items
                .filter(item => item.lastValue !== null)
                .map(item => {
                    const obs: STObservation[] = item.lastValue ? [{
                        '@iot.id': `${item.id}-last`,
                        phenomenonTime: new Date(item.lastValue.timestamp).toISOString(),
                        resultTime: new Date(item.lastValue.timestamp).toISOString(),
                        result: item.lastValue.value
                    }] : []

                    return this.createDatastream(
                        item.id,
                        station.label,
                        item.parameters.phenomenon.label,
                        item.uom,
                        item.parameters.procedure.id,
                        item.parameters.procedure.label,
                        `Measurement procedure: ${item.parameters.procedure.label}`,
                        obs
                    )
                })
        }
    }
}
