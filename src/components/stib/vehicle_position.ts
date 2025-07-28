import { Collector } from 'digitaltwin-core'

export interface Root {
    total_count: number
    results: Result[]
}

export interface Result {
    lineid: string
    vehiclepositions: string | any[] // API retourne un string JSON à parser
}

interface CollectedData {
    timestamp: Date
    source: string
    result: ParsedResult[]
    metadata: {
        collectionDuration: number
        totalLines: number
        successfulParses: number
    }
}

interface ParsedResult {
    lineid: string
    vehiclePositions: VehiclePosition[] // On garde camelCase pour la sortie
}

interface VehiclePosition {
    directionId?: string
    distanceFromPoint?: number
    pointId?: string
    [key: string]: any // Pour les autres propriétés dynamiques
}

export class VehiclePositionCollector extends Collector {
    private readonly baseUrl =
        'https://data.stib-mivb.brussels/api/explore/v2.1/catalog/datasets/vehicle-position-rt-production'

    getConfiguration() {
        return {
            name: 'stib-vehicles-position-collector',
            description: 'Collects STIB vehicles position data from API',
            contentType: 'application/json',
            endpoint: 'api/stib/vehicles-position',
            tags: ['api', 'external', 'demo']
        }
    }

    /**
     * Parse intelligemment le champ vehiclePositions qui peut être :
     * - Un string JSON valide
     * - Un string JSON invalide
     * - Un string vide
     * - Déjà un array
     * - null/undefined
     */
    private parseVehiclePositions(vehiclepositions: string | any[], lineid: string): VehiclePosition[] {
        // Cas 1: Déjà un array
        if (Array.isArray(vehiclepositions)) {
            return vehiclepositions
        }

        // Cas 2: null, undefined ou pas une string
        if (!vehiclepositions || typeof vehiclepositions !== 'string') {
            console.warn(`⚠️ vehiclepositions invalide pour la ligne ${lineid}`)
            return []
        }

        // Cas 3: String vide
        const trimmed = vehiclepositions.trim()
        if (trimmed === '') {
            return []
        }

        // Cas 4: Parsing JSON
        try {
            const parsed = JSON.parse(trimmed)
            return Array.isArray(parsed) ? parsed : []
        } catch (error) {
            console.warn(`⚠️ Impossible de parser vehiclepositions pour la ligne ${lineid}`)
            return []
        }
    }

    async collect(): Promise<Buffer> {
        const startTime = Date.now()

        try {
            console.log('🌐 Fetching data from STIB API...')

            const vehiclePositionResponse = await fetch(`${this.baseUrl}/records?limit=20`)

            if (!vehiclePositionResponse.ok) {
                throw new Error(`Vehicle Positions API error: ${vehiclePositionResponse.status} ${vehiclePositionResponse.statusText}`)
            }

            const parsedData: Root = await vehiclePositionResponse.json()

            // Validation des données reçues
            if (!parsedData || !Array.isArray(parsedData.results)) {
                throw new Error('Invalid API response structure')
            }

            let successfulParses = 0

            // Parsing de chaque ligne
            const resultsParsed: ParsedResult[] = parsedData.results.map((result) => {
                if (!result || typeof result.lineid !== 'string') {
                    console.warn('⚠️ Ligne invalide détectée:', result)
                    return {
                        lineid: result?.lineid || 'unknown',
                        vehiclePositions: []
                    }
                }

                const positions = this.parseVehiclePositions(result.vehiclepositions, result.lineid)

                if (positions.length > 0) successfulParses++

                return {
                    lineid: result.lineid,
                    vehiclePositions: positions
                }
            })

            const collectionDuration = Date.now() - startTime

            const data: CollectedData = {
                timestamp: new Date(),
                source: 'stib',
                result: resultsParsed,
                metadata: {
                    collectionDuration,
                    totalLines: parsedData.results.length,
                    successfulParses
                }
            }

            console.log(
                `📊 Collected ${parsedData.results.length} lines from STIB (${collectionDuration}ms) - ${successfulParses} with vehicles`
            )

            return Buffer.from(JSON.stringify(data, null, 2))
        } catch (error) {
            console.error('❌ Error collecting data from STIB:', error)

            const errorData = {
                timestamp: new Date(),
                source: 'stib',
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                metadata: {
                    collectionDuration: Date.now() - startTime,
                    totalLines: 0,
                    successfulParses: 0
                }
            }

            return Buffer.from(JSON.stringify(errorData, null, 2))
        }
    }

    getSchedule(): string {
        return '*/15 * * * * *' // Every 15 seconds
    }
}