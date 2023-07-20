import prisma from '../prisma/client';
import { MetadataService } from '../generated/typescript/api/resources/metadata/service/MetadataService';
import { CrmMetadata, UnAuthorizedError } from '../generated/typescript/api';
import logError from '../helpers/logError';
import config from '../config';
import { TP_ID, apps } from '@prisma/client';
import { DEFAULT_SCOPE } from '../constants';

const metadataService = new MetadataService({
    async getCrms(req, res) {
        const { 'x-revert-public-token': token } = req.headers;
        if (!token) {
            throw new UnAuthorizedError({ error: 'Api token unauthorized' });
        }

        try {
            const apps = await prisma.apps.findMany({
                select: { scope: true, app_client_id: true, tp_id: true },
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
                    imageSrc: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1673863171/Revert/Hubspot%20logo.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.hubspot),
                    clientId: getClientId(apps, TP_ID.hubspot) || config.HUBSPOT_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.zohocrm,
                    name: 'Zoho CRM',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1674053823/Revert/zoho-crm-logo_u9889x.jpg',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.zohocrm),
                    clientId: getClientId(apps, TP_ID.zohocrm) || config.ZOHOCRM_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.sfdc,
                    name: 'Salesforce',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_fit,h_20,w_70/v1673887647/Revert/SFDC%20logo.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.sfdc),
                    clientId: getClientId(apps, TP_ID.sfdc) || config.SFDC_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.pipedrive,
                    name: 'Pipedrive',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/w_86/v1688633518/Revert/PipedriveLogo.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.pipedrive),
                    clientId: getClientId(apps, TP_ID.pipedrive) || config.PIPEDRIVE_CLIENT_ID,
                },
            ];
            res.send({
                status: 'ok',
                data: crms,
            });
        } catch (error: any) {
            logError(error);
            console.error('Could not get metadata', error);
        }
    },
});

export { metadataService };
