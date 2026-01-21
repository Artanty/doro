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
    }
}

// Usage:
// ConfigManager.init(); // Optional, could move initialization elsewhere
// console.log(ConfigManager.configHash); // Access globally
// ConfigManager.configHash = 1234567890; // Modify globally