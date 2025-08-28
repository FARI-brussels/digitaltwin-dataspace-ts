import { TilesetManager } from "digitaltwin-core"

export class DigitalTerrainManager extends TilesetManager {
    getConfiguration() {
        return {
            name: 'digital_terrain_manager',
            description: 'Manage digital terrain',
            contentType: 'application/json',
            endpoint: 'api/digital_terrain',
            tags: ["DigitalTerrain"]
        }
    }
}