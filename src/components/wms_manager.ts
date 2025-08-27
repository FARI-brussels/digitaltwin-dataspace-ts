import { CustomTableManager, DataResponse, StoreConfiguration } from 'digitaltwin-core'

export class WMSLayersManager extends CustomTableManager {
    getConfiguration(): StoreConfiguration {
        return {
            name: 'wms_layers',
            description: 'Manage WMS layers for mapping applications',
            columns: {
                'wms_url': 'text not null',
                'layer_name': 'text not null',
                'description': 'text',
                'active': 'boolean default true',
            },
            // Custom endpoints for business logic
            endpoints: [
                { path: '/add-layers', method: 'post', handler: 'addMultipleLayers' },
                { path: '/activate/:id', method: 'put', handler: 'toggleLayerStatus' },
                { path: '/search', method: 'get', handler: 'searchLayers' }
            ]
        }
    }

    // Custom endpoint: Add multiple layers at once
    async addMultipleLayers(req: any): Promise<DataResponse> {
        try {
            const { layers } = req.body
            const results = []

            for (const layerData of layers) {
                const id = await this.create({
                    wms_url: layerData.url,
                    layer_name: layerData.name,
                    description: layerData.description || '',
                    active: true,
                })
                results.push({ id, name: layerData.name })
            }

            return {
                status: 200,
                content: JSON.stringify({
                    message: `Added ${results.length} layers successfully`,
                    layers: results
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error: any) {
            return {
                status: 400,
                content: JSON.stringify({ error: error.message }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    // Custom endpoint: Toggle layer status
    async toggleLayerStatus(req: any): Promise<DataResponse> {
        try {
            const { id } = req.params
            const layer = await this.findById(parseInt(id))

            if (!layer) {
                return {
                    status: 404,
                    content: JSON.stringify({ error: 'Layer not found' }),
                    headers: { 'Content-Type': 'application/json' }
                }
            }

            const newStatus = !layer.active
            await this.update(parseInt(id), { active: newStatus })

            return {
                status: 200,
                content: JSON.stringify({
                    message: `Layer ${newStatus ? 'activated' : 'deactivated'}`,
                    layer_id: id,
                    active: newStatus
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error: any) {
            return {
                status: 500,
                content: JSON.stringify({ error: error.message }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }
}