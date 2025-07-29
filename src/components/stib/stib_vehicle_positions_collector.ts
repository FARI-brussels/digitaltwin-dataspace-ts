import { Collector } from 'digitaltwin-core'

/**
 * Data collector for STIB vehicle positions
 */
export class STIBVehiclePositionsCollector extends Collector {
    private readonly endpoint = 'https://stibmivb.opendatasoft.com/api/explore/v2.1/catalog/datasets/vehicle-position-rt-production/records'

    getConfiguration() {
        return {
            name: 'stib_vehicle_positions_collector',
            description: 'Collecte les positions des véhicules STIB en temps réel',
            contentType: 'application/json',
            endpoint: 'api/stib/vehicle-positions',
            tags: ['STIB', 'Vehicle', 'Positions', 'Real-time']
        }
    }

    async collect(): Promise<Buffer> {
        try {
            const response = await fetch(`${this.endpoint}?limit=100`)
            
            if (!response.ok) {
                console.error('Erreur lors de la récupération des positions de véhicules')
                return Buffer.from(JSON.stringify([]), 'utf-8')
            }

            const data = await response.json()
            const rawResults = data.results || []
            const results: any[] = []

            for (const rawResult of rawResults) {
                try {
                    const vehiclePositions = JSON.parse(rawResult.vehiclepositions || '[]')
                    const lineId = String(rawResult.lineid || '')
                    
                    for (const vp of vehiclePositions) {
                        results.push({ ...vp, lineId })
                    }
                } catch (error) {
                    // Skip invalid JSON entries
                    continue
                }
            }

            return Buffer.from(JSON.stringify(results), 'utf-8')
        } catch (error) {
            console.error('Erreur lors de la récupération des positions de véhicules:', error)
            return Buffer.from(JSON.stringify([]), 'utf-8')
        }
    }

    getSchedule(): string {
        return '0 * * * * *' // Every minute
    }
}
