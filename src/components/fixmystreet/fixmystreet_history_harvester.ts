import {DataRecord, Harvester, HarvesterConfiguration} from 'digitaltwin-core'

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

    async harvest(sourceData: DataRecord | DataRecord[], dependenciesDatas: Record<string, DataRecord | DataRecord[] | null>): Promise<Buffer | Buffer[]> {
        // Ensure sourceData is a single DataRecord
        const currentDataRecord = Array.isArray(sourceData) ? sourceData[0] : sourceData;
        const currentDataBuffer = await currentDataRecord.data();
        const currentData = JSON.parse(currentDataBuffer.toString());

        // Get previous version from dependencies
        const previousVersion = dependenciesDatas['fixmystreet_collector'];

        // Handle case where no previous data exists (first run)
        if (!previousVersion) {
            // No previous data to compare, mark all features as new with null history
            const currentFeatures = currentData.features || [];
            for (const feature of currentFeatures) {
                feature.history = null;
            }

            const result = {
                type: "FeatureCollection",
                features: currentFeatures
            };

            return Promise.resolve(Buffer.from(JSON.stringify(result), 'utf-8'));
        }

        const previousDataRecord = Array.isArray(previousVersion) ? previousVersion[0] : previousVersion;
        const previousDataBuffer = await previousDataRecord.data();
        const previousData = JSON.parse(previousDataBuffer.toString());

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