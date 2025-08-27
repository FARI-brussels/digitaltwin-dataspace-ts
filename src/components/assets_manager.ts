import {AssetsManager as CoreAssetsManager} from "digitaltwin-core";

export class AssetsManager extends CoreAssetsManager{

    getConfiguration() {
        return{
            name: 'assets_manager',
            description: 'Manage assets',
            contentType: 'model/gltf-binary',
            endpoint: 'api/assets',
            tags: ["Assets"]
        }
    }
}