import {AssetsManager} from "digitaltwin-core";

export class PointCloudAssetsManager extends AssetsManager{
    getConfiguration() {
        return{
            name: 'pointcloud_assets_manager',
            description: 'Manage pointcloud assets',
            contentType: 'application/json',
            endpoint: 'api/octet-stream',
            tags: ["PointCloud"]
        }
    }
}