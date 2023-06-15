import express, { Express } from 'express';
// Note: Sentry should be initialized as early in your app as possible.
import * as Sentry from '@sentry/node';
import config from './config';
import indexRouter, { crmRouter } from './routes/index';
import revertAuthMiddleware from './helpers/authMiddleware';
import cors from 'cors';
import cron from 'node-cron';
import AuthService from './services/auth';
import { connectionRouter } from './routes/connection';
import metadataRouter from './routes/metadata';

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Limit each IP to 60 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: async () => {
        return JSON.stringify({ message: 'Rate limit reached.' });
    },
});

const app: Express = express();

Sentry.init({
    dsn: config.SENTRY_DSN,
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.1,
});

// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(limiter);
app.use('/', indexRouter);
app.use('/v1/crm', cors(), revertAuthMiddleware(), crmRouter);
app.use('/v1/connection', cors(), revertAuthMiddleware(), connectionRouter);
app.use('/v1/metadata', cors(), metadataRouter);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.listen(config.PORT, () => {
    console.log(`⚡️[server]: Revert server is running at http://localhost:${config.PORT}`);
    // Refresh tokens on a schedule.
    // TODO: do this optimistically.
    cron.schedule(`*/2 * * * *`, async () => {
        await AuthService.refreshOAuthTokensForThirdParty();
    });
}).setTimeout(600000);
