import 'dotenv/config'
import { DigitalTwinEngine, KnexDatabaseAdapter, Env } from 'digitaltwin-core'
import { LocalStorageService } from 'digitaltwin-core'
import { 
  JSONPlaceholderCollector,
  IrcelineSosCollector,
  STIBVehiclePositionCollector,
  BoltGeofenceCollector,
  BoltVehicleTypeCollector,
  BoltVehiclePositionCollector,
  TECGTFSRealtimeCollector,
  TECGTFSStaticCollector,
  SNCBGTFSRealtimeCollector,
  SNCBGTFSStaticCollector
} from './components/index.js'

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
      new STIBVehiclePositionCollector(),
      new BoltGeofenceCollector(),
      new BoltVehicleTypeCollector(),
      new BoltVehiclePositionCollector(),
      new TECGTFSRealtimeCollector(),
      new TECGTFSStaticCollector(),
      new SNCBGTFSRealtimeCollector(),
      new SNCBGTFSStaticCollector(),
    ],
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
