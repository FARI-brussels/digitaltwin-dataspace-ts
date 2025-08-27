import {AssetsManager} from "digitaltwin-core";

export class PointCloudAssetsManager extends AssetsManager{

    getConfiguration() {
        return{
            name: 'pointcloud_manager',
            description: 'Manage point clouds',
            contentType: 'application/octet-stream',
            endpoint: 'api/pointclouds',
            tags: ["PointCloud"]
        }
    }
}