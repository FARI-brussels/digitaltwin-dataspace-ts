#!/usr/bin/env node

import { DigitalTwinEngine, KnexDatabaseAdapter } from 'digitaltwin-core'
import { LocalStorageService } from 'digitaltwin-core'
import { program } from 'commander'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const envPath = path.join(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

async function createEngine(): Promise<DigitalTwinEngine> {
  // Initialize storage service first
  const storage = new LocalStorageService(process.env.STORAGE_PATH || './uploads')
  
  // Database configuration
  const dbConfig = {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'digital_twin_ts'
    }
  }
  
  // Initialize database adapter
  const database = new KnexDatabaseAdapter(dbConfig, storage)
  
  // Create Digital Twin Engine
  const engine = new DigitalTwinEngine({
    database,
    storage
  })
  
  return engine
}

program
  .version('1.0.0')
  .description('Digital Twin CLI commands')

program
  .command('test')
  .description('Run dry-run validation')
  .action(async () => {
    console.log('🧪 Running dry-run validation...')
    
    try {
      const engine = await createEngine()
      
      // Run validation
      const result = await engine.validateConfiguration()
      
      if (result.valid) {
        console.log('✅ Dry-run validation completed successfully')
        console.log(`📊 Components: ${result.summary.valid}/${result.summary.total} valid`)
      } else {
        console.log('❌ Validation failed')
        result.components.forEach(comp => {
          if (!comp.valid) {
            console.log(`  • ${comp.name} (${comp.type}): ${comp.errors.join(', ')}`)
          }
        })
        process.exit(1)
      }
    } catch (error: any) {
      console.error('❌ Validation failed:', error.message)
      process.exit(1)
    }
  })

program
  .command('dev')
  .description('Start development server')
  .action(async () => {
    console.log('🔥 Starting development server...')
    
    try {
      const engine = await createEngine()
      
      // Start the engine
      await engine.start()
      const port = engine.getPort()
      console.log(`🚀 Digital Twin Engine started on port ${port || '3000'}`)
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down gracefully...')
        await engine.stop()
        process.exit(0)
      })
      
    } catch (error: any) {
      console.error('❌ Failed to start server:', error.message)
      process.exit(1)
    }
  })

program.parse()
