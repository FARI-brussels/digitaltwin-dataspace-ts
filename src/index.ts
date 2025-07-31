import 'dotenv/config'
import { DigitalTwinEngine, KnexDatabaseAdapter, Env } from 'digitaltwin-core'
import { LocalStorageService } from 'digitaltwin-core'
import {
  JSONPlaceholderCollector,
  IrcelineSosCollector,
  EnergyCollector,
  STIBGTFSCollector,
  STIBShapeFilesCollector,
  STIBVehiclePositionsCollector,
  STIBStopsCollector,
  BoltGeofenceCollector,
  BoltVehicleTypeCollector,
  BoltVehiclePositionCollector,
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
  DottVehiclePositionCollector,
  DottVehicleTypeCollector,
  LimeVehiclePositionCollector,
  LimeVehicleTypeCollector,
  OpenSkyCollector,
  SensorCommunityCollector,
  SibelgaCollector,
  TelraamTrafficCollector
} from './components/index.js'
import {TilesetsAssetsManager} from "./components/tilesets_assets_manager";
import {PointCloudAssetsManager} from "./components/pointcloud_assets_manager";
import {DigitalTerrainAssetsManager} from "./components/digitalterrain_assets_manager";

async function main(): Promise<void> {
  console.log('🔷 Starting fari-v2 Digital Twin...')

  // Validate environment variables
  const env = Env.validate({
    PORT: Env.schema.number({ optional: true }),
    // SQLite configuration
    DB_PATH: Env.schema.string({ optional: true }),
    // Local storage configuration
    STORAGE_PATH: Env.schema.string({ optional: true }),
    // Redis configuration  
    REDIS_HOST: Env.schema.string({ optional: true }),
    REDIS_PORT: Env.schema.number({ optional: true }),
  })

  console.log('✅ Environment variables validated')

  // Initialize storage service first
  const storage = new LocalStorageService(env.STORAGE_PATH || './uploads')

  // Database configuration
  const dbConfig = {
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
      new JSONPlaceholderCollector(),
      new IrcelineSosCollector(),
      new EnergyCollector(),
      new STIBGTFSCollector(),
      new STIBShapeFilesCollector(),
      new STIBVehiclePositionsCollector(),
      new STIBStopsCollector(),
      new BoltGeofenceCollector(),
      new BoltVehicleTypeCollector(),
      new BoltVehiclePositionCollector(),
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
      new DottVehiclePositionCollector(),
      new DottVehicleTypeCollector(),
      new LimeVehiclePositionCollector(),
      new LimeVehicleTypeCollector(),
      new OpenSkyCollector(),
      new SensorCommunityCollector(),
      new SibelgaCollector(),
      new TelraamTrafficCollector(),
    ],
      assetsManagers: [
          new TilesetsAssetsManager(),
          new PointCloudAssetsManager(),
          new DigitalTerrainAssetsManager(),
      ]
  })

  console.log('🔧 Digital Twin Engine configured')

  // Start the engine
  await engine.start()
  const port = engine.getPort() || env.PORT || 3000
  console.log(`🚀 Digital Twin Engine started on port ${port}`)
  console.log(`📊 Database: SQLite`)
  console.log(`💾 Storage: Local filesystem (${env.STORAGE_PATH || './uploads'})`)
  console.log(`🔄 Queue: Redis enabled`)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...')
    await engine.stop()
    process.exit(0)
  })
}

main().catch((error: Error) => {
  console.error('❌ Failed to start Digital Twin Engine:', error.message)
  process.exit(1)
})
