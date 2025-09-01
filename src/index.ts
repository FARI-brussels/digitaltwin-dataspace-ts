import 'dotenv/config'
import { DigitalTwinEngine, Env, KnexDatabaseAdapter, LocalStorageService, OvhS3StorageService } from 'digitaltwin-core'
import {
    AssetsManager,
    DigitalTerrainManager,
    PointCloudAssetsManager,
    TilesetManager,
    WMSLayersManager,
    IrcelineSosCollector,
    EnergyCollector,
    STIBGTFSCollector,
    STIBShapeFilesCollector,
    STIBVehiclePositionsCollector,
    STIBStopsCollector,
    BoltGeofenceCollector,
    BoltVehiclePositionCollector,
    BoltVehicleTypeCollector,
    TECGTFSRealtimeCollector,
    TECGTFSStaticCollector,
    SNCBGTFSRealtimeCollector,
    SNCBGTFSStaticCollector,
    PonyGeofenceCollector,
    PonyVehiclePositionCollector,
    PonyVehicleTypeCollector,
    InfrabelLineSectionCollector,
    InfrabelOperationalPointsCollector,
    InfrabelPunctualityCollector,
    InfrabelSegmentsCollector,
    BrusselsMobilityBikeCountersCollector,
    BrusselsMobilityBikeCountsCollector,
    BrusselsMobilityTrafficDevicesCollector,
    BrusselsMobilityTrafficCountsCollector,
    DeLijnGTFSRealtimeCollector,
    DeLijnGTFSStaticCollector,
    DottGeofenceCollector,
    TelraamTrafficCollector,
    FixMyStreetIncidentsCollector,
    FixMyStreetHistoryHarvester
} from './components/index.js'

async function main(): Promise<void> {
    console.log('🔷 Starting fari-v2 Digital Twin...')

    // Validate environment variables
    const env = Env.validate({
        NODE_ENV: Env.schema.string({}),
        PORT: Env.schema.number({ optional: true }),
        // SQLite configuration
        DB_PATH: Env.schema.string({ optional: true }),
        // PostgreSQL configuration
        DB_HOST: Env.schema.string({ optional: true }),
        DB_PORT: Env.schema.number({ optional: true }),
        DB_USER: Env.schema.string({ optional: true }),
        DB_PASSWORD: Env.schema.string({ optional: true }),
        DB_NAME: Env.schema.string({ optional: true }),
        // Local storage configuration
        STORAGE_PATH: Env.schema.string({ optional: true }),
        // OVH Object Storage configuration
        OVH_ACCESS_KEY: Env.schema.string({ optional: true }),
        OVH_SECRET_KEY: Env.schema.string({ optional: true }),
        OVH_ENDPOINT: Env.schema.string({ format: 'url', optional: true }),
        OVH_REGION: Env.schema.string({ optional: true }),
        OVH_BUCKET: Env.schema.string({ optional: true }),
        // Redis configuration
        REDIS_HOST: Env.schema.string({ optional: true }),
        REDIS_PORT: Env.schema.number({ optional: true }),
        STIB_API_KEY: Env.schema.string(),
        DE_LIJN_API_KEY: Env.schema.string(),
        TELRAAM_API_KEY: Env.schema.string(),
    })

    console.log('✅ Environment variables validated')

    // Choose config based on NODE_ENV
    const isProd = env.NODE_ENV !== 'development'

    // Storage service
    const storage = isProd
        ? new OvhS3StorageService({
            accessKey: env.OVH_ACCESS_KEY!,
            secretKey: env.OVH_SECRET_KEY!,
            endpoint: env.OVH_ENDPOINT!,
            region: env.OVH_REGION || 'gra',
            bucket: env.OVH_BUCKET!
        })
        : new LocalStorageService(env.STORAGE_PATH || './uploads')

    // Database configuration
    const dbConfig = isProd
        ? {
            client: 'pg',
            connection: {
                host: env.DB_HOST!,
                port: env.DB_PORT || 5432,
                user: env.DB_USER!,
                password: env.DB_PASSWORD!,
                database: env.DB_NAME!
            }
        }
        : {
            client: 'better-sqlite3',
            connection: {
                filename: env.DB_PATH || './data/fari-v2.db'
            },
            useNullAsDefault: true
        }

    // Initialize database adapter
    const database = new KnexDatabaseAdapter(dbConfig, storage)

    // Create Digital Twin Engine
    const engine = new DigitalTwinEngine({
        database,
        storage,
        redis: {
            host: 'localhost',
            port: 6379
        },
        collectors: [
            new IrcelineSosCollector(),
            new EnergyCollector(),
            new STIBGTFSCollector(),
            new STIBShapeFilesCollector(),
            new STIBVehiclePositionsCollector(),
            new STIBStopsCollector(),
            new BoltGeofenceCollector(),
            new BoltVehiclePositionCollector(),
            new BoltVehicleTypeCollector(),
            new TECGTFSRealtimeCollector(),
            new TECGTFSStaticCollector(),
            new SNCBGTFSRealtimeCollector(),
            new SNCBGTFSStaticCollector(),
            new PonyGeofenceCollector(),
            new PonyVehiclePositionCollector(),
            new PonyVehicleTypeCollector(),
            new InfrabelLineSectionCollector(),
            new InfrabelOperationalPointsCollector(),
            new InfrabelPunctualityCollector(),
            new InfrabelSegmentsCollector(),
            new BrusselsMobilityBikeCountersCollector(),
            new BrusselsMobilityBikeCountsCollector(),
            new BrusselsMobilityTrafficDevicesCollector(),
            new BrusselsMobilityTrafficCountsCollector(),
            new DeLijnGTFSRealtimeCollector(),
            new DeLijnGTFSStaticCollector(),
            new DottGeofenceCollector(),
            new TelraamTrafficCollector(),
            new FixMyStreetIncidentsCollector(),
        ],
        harvesters: [
            new FixMyStreetHistoryHarvester(),
        ],
        assetsManagers: [
            new AssetsManager(),
            new PointCloudAssetsManager(),
            new TilesetManager(),
            new DigitalTerrainManager()
        ],
        customTableManagers: [
            new WMSLayersManager(),
        ]
    })

    console.log('🔧 Digital Twin Engine configured')

    // Start the engine
    await engine.start()
    const port = engine.getPort() || env.PORT || 3000
    console.log(`🚀 Digital Twin Engine started on port ${port}`)
    console.log(`📊 Database: ${isProd ? 'PostgreSQL' : 'SQLite'}`)
    console.log(`💾 Storage: ${isProd ? 'OVH S3' : `Local filesystem (${env.STORAGE_PATH || './uploads'})`}`)
    console.log(`🔄 Queue: Redis enabled`)

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down gracefully...')
        await engine.stop()
        process.exit(0)
    })
}

main().catch((error: Error) => {
    console.error('❌ Failed to start Digital Twin Engine:', error)
    process.exit(1)
})
