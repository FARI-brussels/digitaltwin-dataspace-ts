import { DataRecord, Harvester, HarvesterConfiguration } from 'digitaltwin-core'

export class FixMyStreetHistoryHarvester extends Harvester {
    getUserConfiguration(): HarvesterConfiguration {
        return {
            name: "fixmystreet_history_harvester",
            tags: ["FixMyStreet", "History"],
            description: "Compares FixMyStreet versions to detect updates",
            contentType: "application/json",
            source: "fixmystreet_collector",
            dependencies: ['fixmystreet_collector'],
            dependenciesLimit: [1],
            endpoint: "api/fixmystreet/history",
        };
    }

    harvest(sourceData: DataRecord | DataRecord[], dependenciesData: Record<string, DataRecord | DataRecord[]>): Promise<Buffer | Buffer[]> {
        // Ensure sourceData is a single DataRecord
        const currentDataRecord = Array.isArray(sourceData) ? sourceData[0] : sourceData;
        const currentData = JSON.parse(currentDataRecord.data.toString());

        // Get previous version from dependencies
        const previousVersion = dependenciesData['fixmystreet_collector'];
        const previousDataRecord = Array.isArray(previousVersion) ? previousVersion[0] : previousVersion;
        const previousData = JSON.parse(previousDataRecord.data.toString());

        const currentFeatures = currentData.features || [];
        const previousFeatures = previousData.features || [];

        // Create a map of previous features by ID for efficient lookup
        const previousMap: Record<string, any> = {};
        for (const feature of previousFeatures) {
            previousMap[feature.properties.id] = feature;
        }

        // Process each current feature to detect changes
        for (const feature of currentFeatures) {
            const props = feature.properties;
            const fid = props.id;
            const prev = previousMap[fid];

            if (prev) {
                const prevProps = prev.properties;
                if (props.updatedDate !== prevProps.updatedDate) {
                    feature.history = {
                        issueId: fid,
                        newStatus: props.status,
                        newDate: props.updatedDate,
                        oldStatus: prevProps.status,
                        oldDate: prevProps.updatedDate
                    };
                } else {
                    feature.history = null;
                }
            } else {
                feature.history = null;
            }
        }

        const result = {
            type: "FeatureCollection",
            features: currentFeatures
        };

        return Promise.resolve(Buffer.from(JSON.stringify(result), 'utf-8'));
    }
}