import { Collector } from 'digitaltwin-core'

/**
 * Data collector for FixMyStreet Brussels incidents
 */
export class FixMyStreetIncidentsCollector extends Collector {
    private readonly endpoint = 'https://fixmystreet.brussels/api/incidents?page=0&size=12'

    getConfiguration() {
        return {
            name: 'fixmystreet_collector',
            description: 'Collects incident data from FixMyStreet Brussels',
            contentType: 'application/json',
            endpoint: 'api/fixmystreet/incidents',
            tags: ['FixMyStreet', 'Brussels']
        }
    }

    // Convert Belgian Lambert 72 (EPSG:31370) to WGS84 (EPSG:4326)
    private transformCoordinates(x: number, y: number): [number, number] {
        // More accurate transformation from Belgian Lambert 72 to WGS84
        // Using approximate conversion factors for Belgium
        
        // Lambert 72 origin and parameters
        const x0 = 150000.013
        const y0 = 5400088.438
        
        // Convert to meters from origin
        const dx = x - x0
        const dy = y - y0
        
        // Approximate conversion to WGS84 (degrees)
        // These are rough approximation factors for Belgium
        const lat = 50.8 + (dy / 111320) // ~111320 meters per degree latitude
        const lon = 4.35 + (dx / (111320 * Math.cos(lat * Math.PI / 180))) // adjust for longitude
        
        return [lon, lat]
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { 
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        const incidents = data._embedded?.response || []

        const features = incidents.map((incident: any, index: number) => {
            // Transform coordinates
            const x = Number(incident.location?.coordinates?.x)
            const y = Number(incident.location?.coordinates?.y) 
            let coordinates = [0, 0]
            if (x && y && !isNaN(x) && !isNaN(y)) {
                coordinates = this.transformCoordinates(x, y)
            }
            
            // Create clean properties without coordinates and _links
            const { _links, ...cleanIncident } = incident
            if (cleanIncident.location?.coordinates) {
                delete cleanIncident.location.coordinates
            }
            
            // Flatten the location.address if it exists
            if (cleanIncident.location?.address) {
                cleanIncident.location = {
                    ...cleanIncident.location.address,
                    ...cleanIncident.location
                }
                delete cleanIncident.location.address
            }
            
            // Flatten the category structure if it has nested category
            if (cleanIncident.category?.category) {
                cleanIncident.category = {
                    ...cleanIncident.category.category,
                    nameFr: cleanIncident.category.nameFr,
                    nameNl: cleanIncident.category.nameNl,
                    nameEn: cleanIncident.category.nameEn,
                    public: cleanIncident.category.public
                }
            }
            
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates
                },
                properties: cleanIncident,
                id: String(index)
            }
        })

        const geojson = {
            type: 'FeatureCollection',
            features
        }

        return Buffer.from(JSON.stringify(geojson, null, 0), 'utf-8')
    }

    getSchedule(): string {
        return '0 0 * * * *' // Every hour
    }
}
