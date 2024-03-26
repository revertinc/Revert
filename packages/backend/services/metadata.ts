import prisma from '../prisma/client';
import { MetadataService } from '../generated/typescript/api/resources/metadata/service/MetadataService';
import { CrmMetadata } from '../generated/typescript/api';
import { InternalServerError, UnAuthorizedError } from '../generated/typescript/api/resources/common';
import { logError } from '../helpers/logger';
import config from '../config';
import { TP_ID, apps } from '@prisma/client';
import { DEFAULT_SCOPE } from '../constants/common';

const metadataService = new MetadataService({
    async getCrms(req, res) {
        const { 'x-revert-public-token': token } = req.headers;
        if (!token) {
            throw new UnAuthorizedError({ error: 'Api token unauthorized' });
        }

        try {
            const apps = await prisma.apps.findMany({
                select: { scope: true, app_client_id: true, tp_id: true, env: { include: { accounts: true } } },
                where: {
                    env: {
                        public_token: token as string,
                    },
                },
            });
            if (!apps || !apps.length) {
                throw new UnAuthorizedError({
                    error: 'Api token unauthorized',
                });
            }
            res.locals.account = apps?.[0].env.accounts;
            const getScope = (apps: Partial<apps>[], integration: TP_ID) => {
                const app = apps.find((app) => app.tp_id === integration);
                const scopes = app?.is_revert_app ? [] : app?.scope;
                return scopes?.length ? scopes : DEFAULT_SCOPE[integration];
            };
            const getClientId = (apps: Partial<apps>[], integration: TP_ID) => {
                const app = apps.find((app) => app.tp_id === integration);
                return app?.is_revert_app ? undefined : app?.app_client_id;
            };
            let crms: Array<CrmMetadata> = [
                {
                    integrationId: TP_ID.hubspot,
                    name: 'Hubspot',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691139212/Revert/image_57_krrplr.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.hubspot),
                    clientId: getClientId(apps, TP_ID.hubspot) || config.HUBSPOT_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.zohocrm,
                    name: 'Zoho CRM',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691139213/Revert/image_62_bzxn4z.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.zohocrm),
                    clientId: getClientId(apps, TP_ID.zohocrm) || config.ZOHOCRM_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.sfdc,
                    name: 'Salesforce',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691139212/Revert/image_61_svyhd9.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.sfdc),
                    clientId: getClientId(apps, TP_ID.sfdc) || config.SFDC_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.pipedrive,
                    name: 'Pipedrive',
                    imageSrc: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691141825/Revert/pngegg_mhbvfc.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.pipedrive),
                    clientId: getClientId(apps, TP_ID.pipedrive) || config.PIPEDRIVE_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.closecrm,
                    name: 'Close',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/Revert/o8kv3xqzoqioupz0jpnl.jpg',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.closecrm),
                    clientId: getClientId(apps, TP_ID.closecrm) || config.CLOSECRM_CLIENT_ID,
                },
                {
                    integrationId: 'slack',
                    name: 'slack',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1697800999/Revert/sr7ikiijgzsmednoeil0.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.slack),
                    clientId: getClientId(apps, TP_ID.slack) || config.SLACK_CLIENT_ID,
                },
                {
                    integrationId: 'discord',
                    name: 'discord',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/v1701337535/Revert/qorqmz5ggxbb5ckywmxm.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.discord),
                    clientId: getClientId(apps, TP_ID.discord) || config.DISCORD_CLIENT_ID,
                },
                // @TODO add cloudinary links
                {
                    integrationId: TP_ID.linear,
                    name: 'Linear',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_100/v1702974919/Revert/v5e5z6afm5iepiy3cvex.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.linear),
                    clientId: getClientId(apps, TP_ID.linear) || config.LINEAR_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.clickup,
                    name: 'Clickup',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_100/v1702974919/Revert/zckjrxorttrrmyuxf1hu.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.clickup),
                    clientId: getClientId(apps, TP_ID.clickup) || config.CLICKUP_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.jira,
                    name: 'Jira',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1702983006/Revert/szfzkoagws7h3miptezo.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.jira),
                    clientId: getClientId(apps, TP_ID.jira) || config.JIRA_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.trello,
                    name: 'Trello',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1705315257/Revert/abt6asvtvdqhzgadanwx.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.trello),
                    clientId: getClientId(apps, TP_ID.trello) || config.TRELLO_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.ms_dynamics_365_sales,
                    name: 'microsoft dynamics 365',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1707715552/Revert/mecum34mxpxirpi1obxd.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.ms_dynamics_365_sales),
                    clientId: getClientId(apps, TP_ID.ms_dynamics_365_sales) || config.MS_DYNAMICS_SALES_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.bitbucket,
                    name: 'Bitbucket',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711468866/Revert/kuebcmuhxznyjqzl6pvb.svg',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.bitbucket),
                    clientId: getClientId(apps, TP_ID.bitbucket) || config.BITBUCKET_CLIENT_ID,
                },
            ];
            res.send({
                status: 'ok',
                data: crms,
            });
        } catch (error: any) {
            logError(error);
            console.error('Could not get metadata', token, error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
});

export { metadataService };
