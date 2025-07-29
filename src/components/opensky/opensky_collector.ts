import { Collector } from 'digitaltwin-core'

/**
 * Data collector for OpenSky aircraft data
 */
export class OpenSkyCollector extends Collector {
    private readonly endpoint = 'https://opensky-network.org/api/states/all?lamin=50.775029&lomin=4.193481&lamax=50.962233&lomax=4.578003'

    getConfiguration() {
        return {
            name: 'opensky_collector',
            description: 'Collects data from OpenSky APIs',
            contentType: 'application/json',
            endpoint: 'api/opensky',
            tags: ['OpenSky+']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        
        const data = await response.json()
        const states = data.states || []

        if (!states.length) {
            return Buffer.from(JSON.stringify({
                type: 'FeatureCollection',
                features: []
            }), 'utf-8')
        }

        const columns = [
            'icao24', 'callsign', 'origin_country', 'time_position', 'last_contact',
            'longitude', 'latitude', 'baro_altitude', 'on_ground', 'velocity', 'heading',
            'vertical_rate', 'sensors', 'geo_altitude', 'squawk', 'spi', 'position_source'
        ]

        const features = states
            .filter((state: any[]) => state[6] !== null && state[5] !== null) // filter out entries without lat/lon
            .map((state: any[], index: number) => {
                const lon = state[5]
                const lat = state[6]
                let alt = state[13] // geo_altitude

                if (alt === null || (typeof alt === 'number' && isNaN(alt))) {
                    alt = 0
                }

                const properties: any = {}
                columns.forEach((column, i) => {
                    if (['longitude', 'latitude', 'geo_altitude'].includes(column)) {
                        return
                    }
                    let value = state[i]
                    if (typeof value === 'number' && isNaN(value)) {
                        value = null
                    }
                    properties[column] = value
                })

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [lon, lat, alt]
                    },
                    properties,
                    id: state[0] || String(index) // icao24 or fallback to index
                }
            })

        const geojson = {
            type: 'FeatureCollection',
            features
        }

        return Buffer.from(JSON.stringify(geojson), 'utf-8')
    }

    getSchedule(): string {
        return '0 * * * * *' // Every minute
    }
}
