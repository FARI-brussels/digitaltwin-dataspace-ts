import { Collector } from 'digitaltwin-core'

/**
 * Data collector for Sensor Community air quality data
 * Stores raw data in compact format for efficient storage
 * Use SensorCommunitySensorThingsHandler to get SensorThings format
 */
export class SensorCommunityCollector extends Collector {
    private readonly endpoint = 'https://data.sensor.community/airrohr/v1/filter/area=50.8503,4.3517,10'

    getConfiguration() {
        return {
            name: 'sensor_community_collector',
            description: 'Collects raw data from Sensor Community APIs',
            contentType: 'application/json',
            endpoint: 'api/sensor-community',
            tags: ['Sensor Community', 'Air Quality']
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch(this.endpoint)
        if (!response.ok) { throw new Error('Error in response') }
        
        const data = await response.json()
        
        // Store raw data - compact and efficient
        // Filter only valid locations to save space
        const validData = data.filter((item: any) => 
            item.location?.longitude != null && 
            item.location?.latitude != null
        )

        return Buffer.from(JSON.stringify(validData), 'utf-8')
    }

    getSchedule(): string {
        return '0 */1 * * * *'  // Every minute
    }
}
