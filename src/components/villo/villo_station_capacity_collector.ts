import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Villo station capacity and availability
 * Collects real-time data from JCDecaux API for Brussels (Villo)
 */
export class VilloStationCapacityCollector extends Collector {
    private readonly contractName = 'bruxelles'
    private readonly baseUrl = 'https://api.jcdecaux.com/vls/v3/stations'

    getConfiguration() {
        return {
            name: 'villo_station_capacity_collector',
            description: 'Collecte les capacités et disponibilités des stations Villo à Bruxelles',
            contentType: 'application/x-ndjson', // JSON Lines format for better compression
            endpoint: 'api/villo/station-capacity',
            tags: ['Villo', 'Station', 'Capacity', 'Bike Sharing']
        }
    }

    async collect(): Promise<Buffer> {
        const apiKey = process.env.JC_DECAUX_API_KEY
        if (!apiKey) {
            throw new Error('JC_DECAUX_API_KEY environment variable is required')
        }

        const url = `${this.baseUrl}?contract=${this.contractName}&apiKey=${apiKey}`
        const response = await fetch(url)
        
        if (!response.ok) {
            throw new Error(`Error fetching Villo stations: ${response.status} ${response.statusText}`)
        }

        const stations = await response.json()

        const features = stations.map((station: any) => {
            // Extract static properties
            const staticProperties: any = {
                number: station.number,
                contractName: station.contractName,
                name: station.name,
                address: station.address,
                banking: station.banking,
                bonus: station.bonus,
                overflow: station.overflow
            }

            // Extract dynamic properties
            const dynamicProperties: any = {
                status: station.status,
                connected: station.connected,
                lastUpdate: station.lastUpdate
            }

            // Extract capacity information
            const capacityProperties: any = {}
            if (station.totalStands) {
                capacityProperties.totalCapacity = station.totalStands.capacity
                capacityProperties.totalBikes = station.totalStands.availabilities?.bikes ?? 0
                capacityProperties.totalStands = station.totalStands.availabilities?.stands ?? 0
                capacityProperties.totalMechanicalBikes = station.totalStands.availabilities?.mechanicalBikes ?? 0
                capacityProperties.totalElectricalBikes = station.totalStands.availabilities?.electricalBikes ?? 0
                capacityProperties.totalElectricalInternalBatteryBikes = station.totalStands.availabilities?.electricalInternalBatteryBikes ?? 0
                capacityProperties.totalElectricalRemovableBatteryBikes = station.totalStands.availabilities?.electricalRemovableBatteryBikes ?? 0
            }

            if (station.mainStands) {
                capacityProperties.mainCapacity = station.mainStands.capacity
                capacityProperties.mainBikes = station.mainStands.availabilities?.bikes ?? 0
                capacityProperties.mainStands = station.mainStands.availabilities?.stands ?? 0
            }

            if (station.overflowStands) {
                capacityProperties.overflowCapacity = station.overflowStands.capacity
                capacityProperties.overflowBikes = station.overflowStands.availabilities?.bikes ?? 0
                capacityProperties.overflowStands = station.overflowStands.availabilities?.stands ?? 0
            }

            // Combine all properties
            const properties = {
                ...staticProperties,
                ...dynamicProperties,
                ...capacityProperties
            }

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [station.position.longitude, station.position.latitude]
                },
                properties,
                id: `${this.contractName}-${station.number}`
            }
        })

        // Output as JSON Lines (NDJSON) format - one Feature per line
        // This format compresses better and allows streaming/partial reads
        const jsonLines = features
            .map((feature: any) => JSON.stringify(feature))
            .join('\n') + '\n'

        return Buffer.from(jsonLines, 'utf-8')
    }

    getSchedule(): string {
        return '0 */1 * * * *' // Every 1 minute (stations update frequently)
    }
}

