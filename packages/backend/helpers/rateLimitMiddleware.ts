import { Request, Response } from 'express';
import { RateLimiterRedis, IRateLimiterStoreOptions } from 'rate-limiter-flexible';

import redis from '../redis/client';
import { skipRateLimitRoutes } from './utils';
import config from '../config';

// In Memory Cache for storing RateLimiterRedis instances to prevent the creation of a new instance for each request.
// The cache key is the 'rate_limit' value derived from the subscriptions table. Currently, we cache by the 'rate_limit' value for simplicity.
// Using 'subscriptionId' as a key would be more precise but would add complexity in keeping the cache in sync with the database.
const rateLimiters = new Map<number, RateLimiterRedis>();

//We can make this dynamic based on the subscription as well
const RATE_LIMIT_DURATION_IN_MINUTES = 1;
const FALL_BACK_DEFAULT_RATE_LIMIT = 100;

const getRateLimiter = (rateLimit: number): RateLimiterRedis => {
    if (!rateLimiters.has(rateLimit)) {
        const opts: IRateLimiterStoreOptions = {
            storeClient: redis,
            points: rateLimit, // Points represent the maximum number of requests allowed within the set duration.
            duration: RATE_LIMIT_DURATION_IN_MINUTES * 60, // Converts minutes to seconds for the duration.
        };
        rateLimiters.set(rateLimit, new RateLimiterRedis(opts));
    }
    return rateLimiters.get(rateLimit)!;
};

const rateLimitMiddleware = () => async (req: Request, res: Response, next: Function) => {
    if (skipRateLimitRoutes(req)) {
        return next();
    }
    try {
        const { 'x-revert-t-id': tenantId } = req.headers;
        const { subscription, id: accountId } = res.locals.account || {}; // Subscription details are retrieved from response locals set earlier in the revertAuthMiddleware.
        const rateLimit =
            subscription?.rate_limit ?? config.DEFAULT_RATE_LIMIT_DEVELOPER_PLAN ?? FALL_BACK_DEFAULT_RATE_LIMIT; //incase subscription undefined, we will use the default rate limit this is to make sure backward compatibility as currently some accounts might not have subscription attached to them. We can remove the optional chaining and nullish coalescing once we are sure that all accounts have subscription attached to them. In case of DEFAULT_RATE_LIMIT_DEVELOPER_PLAN is missing in config, we will fallback to 1
        const rateLimiter = getRateLimiter(rateLimit);
        //added accountId to make the key unique
        const uniqueKey = `${accountId}-${tenantId}`;
        // rate limit is per tenantId
        await rateLimiter.consume(uniqueKey, 1); // consume 1 point for each request
        next();
    } catch (rejRes) {
        //currently not handling the redis failure here explicitly as it is getting handled in the redis client. If required in future we can handle it here so service does't go down due to rate limit middleware failure which might occur due to redis failure
        if (rejRes instanceof Error) {
            throw rejRes;
        } else {
            res.status(429).send('Rate limit reached.');
        }
    }
};

export default rateLimitMiddleware;
