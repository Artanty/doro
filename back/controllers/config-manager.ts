import { dd } from "../utils/dd";
import axios from 'axios';
import axiosRetry from 'axios-retry';
export interface ConfigHash{
    events: Record<string, number>,
    schedules: Record<string, number>,
}

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
    private static _configHash: ConfigHash = {
        events: {
            
        },
        schedules: {

        }
    }
    
    /**@deprecated use getConfigHash */
    public static get configHash() {
        return ConfigManager.getConfigHash();
    }

    // если хэш не создан - создаем.
    public static getConfigHash(params?: {
        userHandler: string, 
        hashType: string
    }): number {
        try {
            let userHandler = params?.userHandler;
            let hashType = params?.hashType;

            if (!userHandler) {
                userHandler = '74aa6454c1fcabffea7ff172:324c9c440c841889632429b574a39942';
            }
            if (!hashType) {
                hashType = 'events';
            }

            let resultHash = ConfigManager._configHash[hashType][userHandler];
            
            if (resultHash) {
                return resultHash;
            } else {
                resultHash = ConfigManager._makeHash();

                ConfigManager.setConfigHash({
                    userHandler,
                    hashType,
                    hash: resultHash
                });
            }
            return resultHash;
        } catch (error: any) {
            dd(error.message);
            throw new Error(error.message);
        }
    }
   
    public static setConfigHash(params?: {
        userHandler: string,
        hashType: string,
        hash?: number,
    }): void {
        let userHandler = params?.userHandler;
        let hashType = params?.hashType;
        let hashFromProps = params?.hash;
        
        if (!userHandler) {
            userHandler = '74aa6454c1fcabffea7ff172:324c9c440c841889632429b574a39942';
        }
        if (!hashType) {
            hashType = 'events';
        }

        const newHash = hashFromProps ?? ConfigManager._makeHash();

        switch (hashType) {
            case 'events': 
                ConfigManager._configHash[hashType][userHandler] = newHash;
                break;
            
            case 'schedules':
                ConfigManager._configHash[hashType][userHandler] = newHash;
                break;
            default: 
                throw new Error(`setConfigHash err: hashType "${hashType}" not implemented`);
        }
        
        dd(`Setting configHash to ${newHash}`);
    }

    private static _makeHash(): number {
        return new Date().getTime();
    }
}
