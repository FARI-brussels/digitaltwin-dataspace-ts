import {Collector} from "digitaltwin-core";

export interface Root {
    last_updated: number
    ttl: number
    version: string
    data: Data
}

export interface Data {
    bikes: Bike[]
}

export interface Bike {
    bike_id: string
    lat: number
    lon: number
    is_reserved: boolean
    is_disabled: boolean
    current_range_meters: number
    vehicle_type_id: string
    last_reported: number
    vehicle_type: string
}


interface CollectedData {
    timestamp: Date,
    source: 'lime',
    result: Data[]
    metadata: {
        vehicleCount: number
        collectionDuration: number
    }
}

export class LimeVehiclePositionCollector extends Collector{
    private readonly baseUrl= 'https://data.lime.bike'

    getConfiguration(){
        return {
            name:'lime-vehicle-position-collector',
            description: 'Collects Lime scooter position',
            contentType: 'application/json',
            endpoint: '/api/lime/vehicle-position',
            tags: ['api', 'external', 'demo']
        }
    }

    async collect(): Promise<Buffer> {
        const startTime = Date.now()

        try{
            console.log('Collecting Lime Vehicle Position')

            const [positionResponse] = await Promise.all([
                fetch(`${this.baseUrl}/api/partners/v2/gbfs/brussels/free_bike_status`),
            ])

            if(!positionResponse.ok){
                throw new Error(`Lime API error: ${positionResponse.status}`)
            }

            const vehiclePositions: Data[] = await positionResponse.json()
            const collectionDuration = Date.now() - startTime


            const data: CollectedData = {
                timestamp: new Date(),
                source: 'lime',
                result: vehiclePositions,
                metadata: {
                    vehicleCount: vehiclePositions.length,
                    collectionDuration,
                }
            }

            console.log(`📊 Collected ${vehiclePositions.length} vehicles from Lime (${collectionDuration}ms)`)
            return Buffer.from(JSON.stringify(data, null, 2))
        } catch (error) {
            console.error('❌ Error collecting data from Lime:', error)

            const errorData = {
                timestamp: new Date(),
                source: 'lime',
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error',
                metadata: {
                    collectionDuration: Date.now() - startTime,
                }
            }

            return Buffer.from(JSON.stringify(errorData, null, 2))
        }
    }

    getSchedule(): string {
        return '*/15 * * * * *'; //Every 15 seconds
    }


}