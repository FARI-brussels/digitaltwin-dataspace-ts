
import { Collector } from 'digitaltwin-core'
/**
 * Data collector for air
 */
export class IrcelineSosCollector extends Collector {
    getConfiguration() {
        return {
            name: 'irceline_sos',
            description: 'Data collector for IRCELINE air quality data',
            contentType: 'application/json',
            endpoint: 'api/irceline_sos',
            tags: []
        }
    }

    async collect(): Promise<Buffer> {
        const response = await fetch("https://geo.irceline.be/sos/api/v1/timeseries/?expanded=true");
        if (!response.ok) { throw new Error('Error in response') }

        const data = await response.json();

        // Process data into GeoJSON
        const features = data.map((item: any) => {
            const coords = item.station?.geometry?.coordinates;
            const [lon, lat] = Array.isArray(coords) && coords.length >= 2 ? coords : [null, null];

            // Remove unwanted properties
            const { station, referenceValues, extras, statusIntervals, ...cleanItem } = item;

            // Clean station data (remove geometry since it's in GeoJSON geometry)
            const cleanStation = station ? {
                properties: station.properties
            } : undefined;

            // Remove service from parameters
            const cleanParameters = item.parameters ? {
                ...item.parameters,
                service: undefined
            } : undefined;

            return {
                type: "Feature",
                geometry: lon !== null && lat !== null ? {
                    type: "Point",
                    coordinates: [lon, lat]
                } : null,
                properties: {
                    ...cleanItem,
                    station: cleanStation,
                    parameters: cleanParameters
                },
                id: item.id
            };
        });

        const geoJson = {
            type: "FeatureCollection",
            features
        };

        return Buffer.from(JSON.stringify(geoJson), 'utf-8');
    }

    getSchedule(): string {
        return '0 */5 * * * *' // Every 5 minutes by default
    }
}