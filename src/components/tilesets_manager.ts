import { TilesetManager as CoreTilesetManager } from "digitaltwin-core"

export class TilesetManager extends CoreTilesetManager {

    getConfiguration() {
        return {
            name: 'tilesets_manager',
            description: 'Manage tilesets',
            contentType: 'application/json',
            endpoint: 'api/tilesets',
            tags: ["Tileset"]
        }
    }
}
