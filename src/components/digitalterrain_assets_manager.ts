import { AssetsManager } from 'digitaltwin-core'

export class DigitalTerrainAssetsManager extends AssetsManager {

    getConfiguration() {
        return {
            name: 'digitalterrain_assets_manager',
            description: 'Manage digital terrain assets',
            contentType: 'application/json',
            endpoint: 'api/tilesets',
            tags: ["DigitalTerrain"]
        }
    }
}