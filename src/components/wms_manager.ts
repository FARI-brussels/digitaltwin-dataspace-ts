import { CustomTableManager, DataResponse, StoreConfiguration } from 'digitaltwin-core'

interface WMSLayerInput {
    url: string
    name: string
    description?: string
    active?: boolean
}

interface RequestWithParams {
    params?: Record<string, string>
    body?: unknown
}

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
            endpoints: [
                // Gestion des serveurs WMS
                { path: '/servers', method: 'get', handler: 'getAllWmsServers' },
                { path: '/servers/grouped', method: 'get', handler: 'getLayersGroupedByServer' },
                { path: '/servers/:wmsUrl/layers', method: 'get', handler: 'getLayersByServer' },
                { path: '/servers/:wmsUrl/layers', method: 'delete', handler: 'deleteLayersByServer' },
                { path: '/servers/:wmsUrl/layers', method: 'post', handler: 'addLayersToServer' },

                // Gestion des couches
                { path: '/layers/active', method: 'get', handler: 'getActiveLayers' },
                { path: '/layers/:id/toggle', method: 'put', handler: 'toggleLayerStatus' },
                { path: '/layers', method: 'delete', handler: 'deleteAllLayers' },

                // Bulk operations
                { path: '/bulk', method: 'post', handler: 'addMultipleLayers' }
            ]
        }
    }

    /**
     * GET /wms_layers/servers
     * Récupère la liste de tous les serveurs WMS avec le nombre de couches
     */
    async getAllWmsServers(req: RequestWithParams): Promise<DataResponse> {
        try {
            const allLayers = await this.findAll()

            // Grouper par URL WMS
            const serverMap = new Map<string, { url: string; layers: number; active_layers: number }>()

            for (const layer of allLayers) {
                const wmsUrl = layer.wms_url as string

                if (!serverMap.has(wmsUrl)) {
                    serverMap.set(wmsUrl, { url: wmsUrl, layers: 0, active_layers: 0 })
                }

                const server = serverMap.get(wmsUrl)!
                server.layers++
                if (layer.active) {
                    server.active_layers++
                }
            }

            const servers = Array.from(serverMap.values())

            return {
                status: 200,
                content: JSON.stringify({
                    count: servers.length,
                    servers
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error) {
            return {
                status: 500,
                content: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error'
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    /**
     * GET /wms_layers/servers/grouped
     * Récupère toutes les couches groupées par serveur WMS
     * Format: { "url1": [layers...], "url2": [layers...] }
     */
    async getLayersGroupedByServer(req: RequestWithParams): Promise<DataResponse> {
        try {
            const allLayers = await this.findAll()

            // Grouper par URL WMS
            const grouped: Record<string, Array<{
                id: number
                layer_name: string
                description: string
                active: boolean
                created_at: Date
                updated_at: Date
            }>> = {}

            for (const layer of allLayers) {
                const wmsUrl = layer.wms_url as string

                if (!grouped[wmsUrl]) {
                    grouped[wmsUrl] = []
                }

                grouped[wmsUrl].push({
                    id: layer.id,
                    layer_name: layer.layer_name as string,
                    description: layer.description as string || '',
                    active: layer.active as boolean,
                    created_at: layer.created_at,
                    updated_at: layer.updated_at
                })
            }

            return {
                status: 200,
                content: JSON.stringify(grouped),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error) {
            return {
                status: 500,
                content: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error'
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    /**
     * GET /wms_layers/servers/:wmsUrl/layers
     * Récupère toutes les couches d'un serveur WMS donné
     */
    async getLayersByServer(req: RequestWithParams): Promise<DataResponse> {
        try {
            const wmsUrl = req.params?.wmsUrl ? decodeURIComponent(req.params.wmsUrl) : ''

            if (!wmsUrl) {
                return {
                    status: 400,
                    content: JSON.stringify({ error: 'WMS URL is required' }),
                    headers: { 'Content-Type': 'application/json' }
                }
            }

            const layers = await this.findByColumn('wms_url', wmsUrl)

            return {
                status: 200,
                content: JSON.stringify({
                    wms_url: wmsUrl,
                    count: layers.length,
                    layers
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error) {
            return {
                status: 500,
                content: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error'
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    /**
     * DELETE /wms_layers/servers/:wmsUrl/layers
     * Supprime toutes les couches d'un serveur WMS donné
     */
    async deleteLayersByServer(req: RequestWithParams): Promise<DataResponse> {
        try {
            const wmsUrl = req.params?.wmsUrl ? decodeURIComponent(req.params.wmsUrl) : ''

            if (!wmsUrl) {
                return {
                    status: 400,
                    content: JSON.stringify({ error: 'WMS URL is required' }),
                    headers: { 'Content-Type': 'application/json' }
                }
            }

            const deletedCount = await this.deleteByColumn('wms_url', wmsUrl)

            return {
                status: 200,
                content: JSON.stringify({
                    message: `Deleted ${deletedCount} layer(s) from ${wmsUrl}`,
                    deleted_count: deletedCount
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error) {
            return {
                status: 500,
                content: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error'
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    /**
     * POST /wms_layers/servers/:wmsUrl/layers
     * Ajoute des couches à un serveur WMS spécifique
     * Body: { layers: string[], description?: string }
     */
    async addLayersToServer(req: RequestWithParams): Promise<DataResponse> {
        try {
            const wmsUrl = req.params?.wmsUrl ? decodeURIComponent(req.params.wmsUrl) : ''

            if (!wmsUrl) {
                return {
                    status: 400,
                    content: JSON.stringify({ error: 'WMS URL is required' }),
                    headers: { 'Content-Type': 'application/json' }
                }
            }

            const body = req.body as { layers?: string[]; description?: string }

            if (!body || !Array.isArray(body.layers) || body.layers.length === 0) {
                return {
                    status: 400,
                    content: JSON.stringify({ error: 'Request body must contain a "layers" array' }),
                    headers: { 'Content-Type': 'application/json' }
                }
            }

            const results: Array<{ id: number; wms_url: string; layer_name: string }> = []

            for (const layerName of body.layers) {
                const id = await this.create({
                    wms_url: wmsUrl,
                    layer_name: layerName,
                    description: body.description || '',
                    active: true,
                })
                results.push({ id, wms_url: wmsUrl, layer_name: layerName })
            }

            return {
                status: 201,
                content: JSON.stringify({
                    message: `Added ${results.length} layer(s) to ${wmsUrl}`,
                    layers: results
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error) {
            return {
                status: 400,
                content: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error'
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    /**
     * POST /wms_layers/bulk
     * Ajoute plusieurs couches en une fois (multi-serveurs)
     * Body: [{ url, name, description?, active? }, ...]
     */
    async addMultipleLayers(req: RequestWithParams): Promise<DataResponse> {
        try {
            const body = req.body

            if (!Array.isArray(body)) {
                return {
                    status: 400,
                    content: JSON.stringify({
                        error: 'Request body must be an array of layer objects with "url" and "name" properties'
                    }),
                    headers: { 'Content-Type': 'application/json' }
                }
            }

            const results: Array<{ id: number; wms_url: string; layer_name: string }> = []

            for (const layerData of body) {
                if (!this.isWMSLayerInput(layerData)) {
                    throw new Error('Each layer must have "url" and "name" properties')
                }

                const id = await this.create({
                    wms_url: layerData.url,
                    layer_name: layerData.name,
                    description: layerData.description || '',
                    active: layerData.active !== undefined ? layerData.active : true,
                })
                results.push({ id, wms_url: layerData.url, layer_name: layerData.name })
            }

            return {
                status: 201,
                content: JSON.stringify({
                    message: `Added ${results.length} layer(s) successfully`,
                    layers: results
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error) {
            return {
                status: 400,
                content: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error'
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    /**
     * DELETE /wms_layers/layers
     * Supprime TOUTES les couches de tous les serveurs WMS
     */
    async deleteAllLayers(req: RequestWithParams): Promise<DataResponse> {
        try {
            const allLayers = await this.findAll()

            for (const layer of allLayers) {
                await this.delete(layer.id)
            }

            return {
                status: 200,
                content: JSON.stringify({
                    message: `Deleted all ${allLayers.length} layer(s)`,
                    deleted_count: allLayers.length
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error) {
            return {
                status: 500,
                content: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error'
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    /**
     * PUT /wms_layers/layers/:id/toggle
     * Active/désactive une couche (toggle)
     */
    async toggleLayerStatus(req: RequestWithParams): Promise<DataResponse> {
        try {
            const id = req.params?.id

            if (!id) {
                return {
                    status: 400,
                    content: JSON.stringify({ error: 'Layer ID is required' }),
                    headers: { 'Content-Type': 'application/json' }
                }
            }

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
        } catch (error) {
            return {
                status: 500,
                content: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error'
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    /**
     * GET /wms_layers/layers/active
     * Récupère uniquement les couches actives (tous serveurs confondus)
     */
    async getActiveLayers(req: RequestWithParams): Promise<DataResponse> {
        try {
            const activeLayers = await this.findByColumn('active', true)

            return {
                status: 200,
                content: JSON.stringify({
                    count: activeLayers.length,
                    layers: activeLayers
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        } catch (error) {
            return {
                status: 500,
                content: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error'
                }),
                headers: { 'Content-Type': 'application/json' }
            }
        }
    }

    // Type guards
    private isWMSLayerInput(obj: unknown): obj is WMSLayerInput {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            'url' in obj &&
            'name' in obj &&
            typeof (obj as WMSLayerInput).url === 'string' &&
            typeof (obj as WMSLayerInput).name === 'string'
        )
    }

}