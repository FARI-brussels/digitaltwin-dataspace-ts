import { DigitalTwinEngine, KnexDatabaseAdapter, Env } from 'digitaltwin-core'
import { LocalStorageService } from 'digitaltwin-core'
import {JSONPlaceholderCollector, VehiclePositionCollector} from './components/index.js'
import dotenv from 'dotenv'

async function main(): Promise<void> {
  console.log('🔷 Starting digital_twin_ts Digital Twin...')
  dotenv.config()

  // Validate environment variables
  const env = Env.validate({
    PORT: Env.schema.number({ optional: true }),
    // PostgreSQL configuration
    DB_HOST: Env.schema.string(),
    DB_PORT: Env.schema.number({ optional: true }),
    DB_USER: Env.schema.string(),
    DB_PASSWORD: Env.schema.string(),
    DB_NAME: Env.schema.string(),
    // Local storage configuration
    STORAGE_PATH: Env.schema.string({ optional: true }),
    // Redis configuration
    REDIS_HOST: Env.schema.string({ optional: true }),
    REDIS_PORT: Env.schema.number({ optional: true }),
    STIB_API_KEY: Env.schema.string(),
  })
  
  console.log('✅ Environment variables validated')
  
  // Initialize storage service first
  const storage = new LocalStorageService(env.STORAGE_PATH || './uploads')
  
  // Database configuration
  const dbConfig = {
    client: 'pg',
    connection: {
      host: env.DB_HOST,
      port: env.DB_PORT || 5432,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME
    }
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
    collectors: [new JSONPlaceholderCollector(), new VehiclePositionCollector()],
  })
  
  console.log('🔧 Digital Twin Engine configured')
  
  // Start the engine
  await engine.start()
  const port = engine.getPort() || env.PORT || 3000
  console.log(`🚀 Digital Twin Engine started on port ${port}`)
  console.log(`📊 Database: PostgreSQL`)
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
