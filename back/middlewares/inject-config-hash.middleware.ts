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
                dd(req.originalUrl)
                if (!parsedBody[thisProjectResProp()]) {
                    throw new Error(`TODO: on request ${req.originalUrl} -> wrap ${thisProjectResProp()} response in ${thisProjectResProp()} prop`);
                } else {
                    parsedBody[thisProjectResProp()] = {
                        ...parsedBody[thisProjectResProp()], 
                        config_hash: ConfigManager.configHash
                    };
                }
                // Augment the response body with configHash
                // const augmentedBody = { ...parsedBody, config_hash: ConfigManager.configHash };

                // originalSend(JSON.stringify(augmentedBody));
                originalSend(JSON.stringify(parsedBody));
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