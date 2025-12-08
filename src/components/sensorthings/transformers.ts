import { type STThing, type SourceConfig, createDatastream } from './unified_sensorthings_handler.js'

// Sensor.Community transformer
export const sensorCommunityTransformer: SourceConfig = {
    collectorName: 'sensor_community_collector',
    transform: (items: any[]): STThing[] => {
        const groups: Record<number, any[]> = {}
        for (const item of items) { const id = item.location.id; (groups[id] ??= []).push(item) }

        return Object.values(groups).map(group => {
            const loc = group[0].location
            const dsMap = new Map<string, { sensor: any; obs: any[]; vt: string }>()
            for (const item of group) for (const sv of item.sensordatavalues) {
                const key = `${loc.id}-${item.sensor.id}-${sv.value_type}`
                if (!dsMap.has(key)) dsMap.set(key, { sensor: item.sensor, obs: [], vt: sv.value_type })
                dsMap.get(key)!.obs.push({ '@iot.id': sv.id, phenomenonTime: item.timestamp.replace(' ', 'T') + '.000Z', resultTime: item.timestamp.replace(' ', 'T') + '.000Z', result: parseFloat(sv.value) })
            }
            return {
                '@iot.id': loc.id, '@iot.selfLink': '', name: `Sensor.Community Station ${loc.id}`, description: 'Citizen science monitoring station',
                properties: { country: loc.country, indoor: loc.indoor === 1 },
                Locations: [{ '@iot.id': loc.id, name: `Location ${loc.id}`, description: `Location ${loc.id}`, encodingType: 'application/geo+json', location: { type: 'Point', coordinates: [parseFloat(loc.longitude), parseFloat(loc.latitude), parseFloat(loc.altitude) || 0] } }],
                Datastreams: Array.from(dsMap.entries()).map(([id, { sensor, obs, vt }]) => createDatastream(id, `Station ${loc.id}`, vt, undefined, sensor.id, sensor.sensor_type.name, obs))
            }
        })
    }
}

// IRCELINE transformer
export const ircelineTransformer: SourceConfig = {
    collectorName: 'irceline_sos',
    transform: (items: any[]): STThing[] => {
        const groups: Record<number, any[]> = {}
        for (const item of items) { const id = item.station.id; (groups[id] ??= []).push(item) }

        return Object.values(groups).map(group => {
            const st = group[0].station
            const [lon, lat] = st.coordinates
            return {
                '@iot.id': st.id, '@iot.selfLink': '', name: st.label, description: `IRCELINE station: ${st.label}`,
                properties: { network: 'IRCELINE' },
                Locations: [{ '@iot.id': st.id, name: st.label, description: st.label, encodingType: 'application/geo+json', location: { type: 'Point', coordinates: [parseFloat(String(lon)), parseFloat(String(lat))] } }],
                Datastreams: group.filter(i => i.lastValue).map(i => createDatastream(i.id, st.label, i.parameters.phenomenon.label, i.uom, i.parameters.procedure.id, i.parameters.procedure.label,
                    [{ '@iot.id': `${i.id}-last`, phenomenonTime: new Date(i.lastValue.timestamp).toISOString(), resultTime: new Date(i.lastValue.timestamp).toISOString(), result: i.lastValue.value }]))
            }
        })
    }
}

// Export all sources for easy registration
export const AIR_QUALITY_SOURCES: Record<string, SourceConfig> = {
    'sensor-community': sensorCommunityTransformer,
    'irceline': ircelineTransformer
}

