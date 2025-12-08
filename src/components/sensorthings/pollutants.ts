/**
 * Shared pollutant/property ontology for air quality data
 * Provides consistent naming, units, and semantic definitions across data sources
 */

export interface PollutantDefinition {
    id: string
    name: string
    description: string
    unit: string
    unitName: string
    definition: string
    unitDefinition: string
    aliases: string[]  // Alternative names from different sources
}

/**
 * Canonical pollutant definitions
 * Maps various source-specific names to standardized identifiers
 */
export const POLLUTANTS: Record<string, PollutantDefinition> = {
    'PM10': {
        id: 'PM10',
        name: 'PM10',
        description: 'Particulate Matter < 10 µm',
        unit: 'µg/m³',
        unitName: 'Microgram per cubic meter',
        definition: 'http://dd.eionet.europa.eu/vocabulary/aq/pollutant/5',
        unitDefinition: 'http://dd.eionet.europa.eu/vocabulary/uom/concentration/ug.m-3',
        aliases: ['P1', 'pm10', 'PM 10']
    },
    'PM2.5': {
        id: 'PM2.5',
        name: 'PM2.5',
        description: 'Particulate Matter < 2.5 µm',
        unit: 'µg/m³',
        unitName: 'Microgram per cubic meter',
        definition: 'http://dd.eionet.europa.eu/vocabulary/aq/pollutant/6001',
        unitDefinition: 'http://dd.eionet.europa.eu/vocabulary/uom/concentration/ug.m-3',
        aliases: ['P2', 'pm2.5', 'PM 2.5', 'PM25']
    },
    'PM1': {
        id: 'PM1',
        name: 'PM1',
        description: 'Particulate Matter < 1 µm',
        unit: 'µg/m³',
        unitName: 'Microgram per cubic meter',
        definition: 'http://dd.eionet.europa.eu/vocabulary/aq/pollutant/6002',
        unitDefinition: 'http://dd.eionet.europa.eu/vocabulary/uom/concentration/ug.m-3',
        aliases: ['P0', 'pm1', 'PM 1']
    },
    'PM4': {
        id: 'PM4',
        name: 'PM4',
        description: 'Particulate Matter < 4 µm',
        unit: 'µg/m³',
        unitName: 'Microgram per cubic meter',
        definition: 'http://dd.eionet.europa.eu/vocabulary/aq/pollutant/6003',
        unitDefinition: 'http://dd.eionet.europa.eu/vocabulary/uom/concentration/ug.m-3',
        aliases: ['P4', 'pm4', 'PM 4']
    },
    'NO2': {
        id: 'NO2',
        name: 'NO2',
        description: 'Nitrogen dioxide',
        unit: 'µg/m³',
        unitName: 'Microgram per cubic meter',
        definition: 'http://dd.eionet.europa.eu/vocabulary/aq/pollutant/8',
        unitDefinition: 'http://dd.eionet.europa.eu/vocabulary/uom/concentration/ug.m-3',
        aliases: ['no2', 'Nitrogen dioxide']
    },
    'NO': {
        id: 'NO',
        name: 'NO',
        description: 'Nitrogen monoxide',
        unit: 'µg/m³',
        unitName: 'Microgram per cubic meter',
        definition: 'http://dd.eionet.europa.eu/vocabulary/aq/pollutant/38',
        unitDefinition: 'http://dd.eionet.europa.eu/vocabulary/uom/concentration/ug.m-3',
        aliases: ['no', 'Nitrogen monoxide']
    },
    'O3': {
        id: 'O3',
        name: 'O3',
        description: 'Ozone',
        unit: 'µg/m³',
        unitName: 'Microgram per cubic meter',
        definition: 'http://dd.eionet.europa.eu/vocabulary/aq/pollutant/7',
        unitDefinition: 'http://dd.eionet.europa.eu/vocabulary/uom/concentration/ug.m-3',
        aliases: ['o3', 'Ozone']
    },
    'SO2': {
        id: 'SO2',
        name: 'SO2',
        description: 'Sulphur dioxide',
        unit: 'µg/m³',
        unitName: 'Microgram per cubic meter',
        definition: 'http://dd.eionet.europa.eu/vocabulary/aq/pollutant/1',
        unitDefinition: 'http://dd.eionet.europa.eu/vocabulary/uom/concentration/ug.m-3',
        aliases: ['so2', 'Sulphur dioxide', 'Sulfur dioxide']
    },
    'CO': {
        id: 'CO',
        name: 'CO',
        description: 'Carbon monoxide',
        unit: 'mg/m³',
        unitName: 'Milligram per cubic meter',
        definition: 'http://dd.eionet.europa.eu/vocabulary/aq/pollutant/10',
        unitDefinition: 'http://dd.eionet.europa.eu/vocabulary/uom/concentration/mg.m-3',
        aliases: ['co', 'Carbon monoxide']
    },
    'temperature': {
        id: 'temperature',
        name: 'Air Temperature',
        description: 'Ambient air temperature',
        unit: '°C',
        unitName: 'Degree Celsius',
        definition: 'http://vocab.nerc.ac.uk/collection/P07/current/CFSN0023/',
        unitDefinition: 'http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html#DegreeCelsius',
        aliases: ['temp', 'Temperature']
    },
    'humidity': {
        id: 'humidity',
        name: 'Relative Humidity',
        description: 'Relative humidity of air',
        unit: '%',
        unitName: 'Percent',
        definition: 'http://vocab.nerc.ac.uk/collection/P07/current/CFSN0413/',
        unitDefinition: 'http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html#Percent',
        aliases: ['rh', 'Humidity', 'Relative Humidity']
    },
    'pressure': {
        id: 'pressure',
        name: 'Atmospheric Pressure',
        description: 'Atmospheric pressure at sensor level',
        unit: 'hPa',
        unitName: 'Hectopascal',
        definition: 'http://vocab.nerc.ac.uk/collection/P07/current/CFSN0015/',
        unitDefinition: 'http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html#Hectopascal',
        aliases: ['Atmospheric Pressure', 'pressure_at_sealevel']
    }
}

// Build reverse lookup map for aliases
const aliasMap = new Map<string, string>()
for (const [id, def] of Object.entries(POLLUTANTS)) {
    aliasMap.set(id.toLowerCase(), id)
    aliasMap.set(def.name.toLowerCase(), id)
    for (const alias of def.aliases) {
        aliasMap.set(alias.toLowerCase(), id)
    }
}

/**
 * Resolves a source-specific property name to canonical pollutant definition
 */
export function resolvePollutant(sourceProperty: string): PollutantDefinition | null {
    const canonicalId = aliasMap.get(sourceProperty.toLowerCase())
    return canonicalId ? POLLUTANTS[canonicalId] : null
}

/**
 * Creates a fallback definition for unknown properties
 */
export function createFallbackDefinition(sourceProperty: string, unit?: string): PollutantDefinition {
    return {
        id: sourceProperty,
        name: sourceProperty,
        description: `Measurement of ${sourceProperty}`,
        unit: unit || '?',
        unitName: unit || 'Unknown',
        definition: `http://example.org/property/${encodeURIComponent(sourceProperty)}`,
        unitDefinition: 'http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html#Unknown',
        aliases: []
    }
}

/**
 * Gets pollutant definition, with fallback for unknown properties
 */
export function getPollutant(sourceProperty: string, unit?: string): PollutantDefinition {
    return resolvePollutant(sourceProperty) || createFallbackDefinition(sourceProperty, unit)
}


