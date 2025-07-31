import { AssetsManager } from 'digitaltwin-core'

export class TilesetsAssetsManager extends AssetsManager {

    getConfiguration() {
        return {
            name: 'tilesets_assets_manager',
            description: 'Manage tilesets assets',
            contentType: 'application/json',
            endpoint: 'api/tilesets',
            tags: ["Tileset"]
        }
    }
}
