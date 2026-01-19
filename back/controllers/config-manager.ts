import { buildOuterEntityId } from "../utils/buildOuterEntityId";
import { dd } from "../utils/dd";
import { parseServerResponse } from "../utils/parseServerResponse";
import { EventStateController } from "./eventStateController";
import axios from 'axios';
import axiosRetry from 'axios-retry';

// Настраиваем повторные попытки
axiosRetry(axios, {
    retries: 5,                    // 5 попыток
    retryDelay: (retryCount) => {
        return retryCount * 5000;    // 5 секунд между попытками
    },
    retryCondition: (error) => {
        // Повторяем при сетевых ошибках или 5xx статусах
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
            Boolean(error.response && error.response.status >= 500);
    },
    shouldResetTimeout: true       // Сбрасываем таймаут при каждой попытке
});

export class ConfigManager {
    private static _configHash: number;

    /**
     * Static getter to retrieve the current configuration hash
     *
     * @returns {number} The current configuration hash
     */
    public static get configHash(): number {
        return ConfigManager._configHash;
    }

    /**
     * used by:
     * EventController.createEvent
     * 
     *
     * @param {number} newHash New configuration hash
     */
    public static setConfigHash(newHash?: number) {
        newHash = newHash ?? new Date().getTime();
        ConfigManager._configHash = newHash;
        dd(`Setting configHash to ${newHash}`);
        ConfigManager.updateOuterConfigHash(newHash);
    }


    public static async updateOuterConfigHash(newHash: number) {
        dd('updateOuterConfigHash started')
        const minimalEventForTikAction = { 
            id: buildOuterEntityId('configHash', 1), // 1 - id
            cur: newHash,
        };
        const updateEventsStatePayloadData = EventStateController.addTikActionForEvents(minimalEventForTikAction, 'upsert');
        let tikResponse;
        try {
            tikResponse = await axios.post(`${process.env['TIK_BACK_URL']}/updateEventsState`,
                {
                    poolId: 'current_user_id',
                    data: updateEventsStatePayloadData,
                    projectId: 'doro@web',

                    // requesterProject,
                    // requesterApiKey: apiKeyHeader,
                    // requesterUrl
                },
                {
                    timeout: 10000,  // Таймаут 10 секунд на каждый запрос
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
                // ,
                //  {
                //   headers: {
                //     'X-Project-Id': process.env.PROJECT_ID,
                //     'X-Project-Domain-Name': `${req.protocol}://${req.get('host')}`,
                //     'X-Api-Key': process.env.BASE_KEY
                //   }
                // }
            );
        } catch (error: any) {
            console.error('process.env[TIK_BACK_URL]/updateEventsState error:', error.message);
            throw new Error(error);
        }
        dd('updateOuterConfigHash result:')
        dd(parseServerResponse(tikResponse))
    }


}

// Usage:
// ConfigManager.init(); // Optional, could move initialization elsewhere
// console.log(ConfigManager.configHash); // Access globally
// ConfigManager.configHash = 1234567890; // Modify globally