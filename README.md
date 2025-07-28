# digital_twin_ts

Digital Twin application built with [digitaltwin-core](https://github.com/CePseudoBE/digital-twin-core).

## Features

✅ **Environment Validation** - Automatic validation of required configuration  
✅ **Database Support** - SQLite for easy development  
✅ **Storage** - Local file system storage (./uploads)  
✅ **Queue Management** - Redis-powered background jobs  
✅ **Example Components** - Random data collector and data processor included

## Configuration

- **Database**: SQLite
- **Storage**: Local File System (./uploads)
- **Queue**: Redis (BullMQ)
- **Docker**: Not included

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env .env.local
   # Edit .env.local with your actual configuration
   ```

3. **Set up Redis:**
   ```bash
   # Make sure Redis is running
   redis-server
   ```


4. **Start development server:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `node dt test` - Run dry-run validation (no database changes)
- `node dt dev` - Start server via CLI

## Learn More

- [digitaltwin-core Documentation](https://github.com/CePseudoBE/digital-twin-core)
- [Digital Twin Concepts](https://en.wikipedia.org/wiki/Digital_twin)
- [Environment Configuration Best Practices](https://12factor.net/config)
