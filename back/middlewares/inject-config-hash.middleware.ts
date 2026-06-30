import { ConfigManager } from '../controllers/config-manager';
import { createShortHash } from '../utils/createHash';
import { dd } from '../utils/dd';
import { thisProjectResProp } from '../utils/getResProp';
import { getUserFromRequest } from '../utils/getUserFromRequest';
import { MemoryStorageService } from '../utils/memoryStorageService';
import { sanitizePath } from '../utils/sanitizePath';

export const injectConfigHashMiddleware = async (req, res, next) => {
    await next(); // Continue processing request handlers

    const userHandler = getUserFromRequest(req);

    // Intercept the final response
    const originalSend = res.send.bind(res);

    res.send = (body) => {
        try {
            const parsedBody = JSON.parse(body)
            if (typeof parsedBody === 'object') {
                
                const augmentedBody = { 
                    ...parsedBody, 
                    config_hash: ConfigManager.getConfigHash({ userHandler, hashType: 'events' }),
                    config_hash_schedules: ConfigManager.getConfigHash({ userHandler, hashType: 'schedules' }),
                };

                originalSend(JSON.stringify(augmentedBody));
                
            } else {
                // Pass-through other kinds of responses untouched
                originalSend(body);
            }
        } catch (err) {
            dd(`error: ${err}`);
            originalSend(body);
        }
    };
};