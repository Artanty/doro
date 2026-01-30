import { ConfigManager } from '../controllers/config-manager';
import { dd } from '../utils/dd';
import { thisProjectResProp } from '../utils/getResProp';

export const injectConfigHashMiddleware = async (req, res, next) => {
    await next(); // Continue processing request handlers

    // Intercept the final response
    const originalSend = res.send.bind(res);

    res.send = (body) => {
        try {
            const parsedBody = JSON.parse(body)
            if (typeof parsedBody === 'object') {
                
                const augmentedBody = { 
                    ...parsedBody, 
                    config_hash: ConfigManager.configHash 
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