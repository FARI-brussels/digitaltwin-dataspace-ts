import { Collector } from 'digitaltwin-core'

/**
 * Data collector for STIB stops
 */
export class STIBStopsCollector extends Collector {
    private readonly stopsEndpoint = 'https://stibmivb.opendatasoft.com/explore/dataset/gtfs-files-production/files/7068c8d492df76c5125fac081b5e09e9/download/'

    getConfiguration() {
        return {
            name: 'stib_stops_collector',
            description: 'Collecte les arrêts STIB avec coordonnées géographiques',
            contentType: 'application/geo+json',
            endpoint: 'api/stib/stops',
            tags: ['STIB', 'Arrêts', 'GeoJSON']
        }
    }

    private convertStopIdsToGeneric(stopId: string): string {
        return stopId.replace(/[^0-9]/g, '')
    }

    async collect(): Promise<Buffer> {
        try {
            const response = await fetch(this.stopsEndpoint)
            
            if (!response.ok) {
                console.error('Erreur lors du chargement des arrêts officiels')
                return Buffer.from(JSON.stringify({
                    type: 'FeatureCollection',
                    features: []
                }), 'utf-8')
            }

            const csvText = await response.text()
            const lines = csvText.split('\n')
            const headers = lines[0].split(',')
            
            const stopIdIndex = headers.indexOf('stop_id')
            const stopLatIndex = headers.indexOf('stop_lat')
            const stopLonIndex = headers.indexOf('stop_lon')

            if (stopIdIndex === -1 || stopLatIndex === -1 || stopLonIndex === -1) {
                throw new Error('Required CSV columns not found')
            }

            const stops = new Map()
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',')
                if (values.length < Math.max(stopIdIndex, stopLatIndex, stopLonIndex) + 1) continue
                
                const stopId = this.convertStopIdsToGeneric(values[stopIdIndex])
                const lat = parseFloat(values[stopLatIndex])
                const lon = parseFloat(values[stopLonIndex])
                
                if (!isNaN(lat) && !isNaN(lon) && !stops.has(stopId)) {
                    stops.set(stopId, { stopId, lat, lon })
                }
            }

            const features = Array.from(stops.values()).map(stop => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [stop.lon, stop.lat]
                },
                properties: {
                    stop_id: stop.stopId
                }
            }))

            const geojson = {
                type: 'FeatureCollection',
                features
            }

            return Buffer.from(JSON.stringify(geojson), 'utf-8')
        } catch (error) {
            console.error('Erreur lors du chargement des arrêts officiels:', error)
            return Buffer.from(JSON.stringify({
                type: 'FeatureCollection',
                features: []
            }), 'utf-8')
        }
    }

    getSchedule(): string {
        return '0 0 * * * *' // Every hour
    }
}
