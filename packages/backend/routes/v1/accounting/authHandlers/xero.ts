import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

class XeroAuthHandler extends BaseOAuthHandler {
    async handleOAuth({
        account,
        clientId,
        clientSecret,
        code,
        integrationId,
        revertPublicKey,
        svixAppId,
        environmentId,
        tenantId,
        tenantSecretToken,
        response,
        redirectUrl,
    }: IntegrationAuthProps) {
        const formData = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/xero`,
        };
        const headerData = {
            client_id: clientId || config.XERO_CLIENT_ID,
            client_secret: clientSecret || config.XERO_CLIENT_SECRET,
        };
        const encodedClientIdSecret = Buffer.from(headerData.client_id + ':' + headerData.client_secret).toString(
            'base64'
        );
        const result: any = await axios({
            method: 'post',
            url: 'https://identity.xero.com/connect/token',
            headers: {
                Authorization: 'Basic ' + encodedClientIdSecret,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: qs.stringify(formData),
        });

        logInfo('OAuth creds for Xero', result.data);

        try {
            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    tp_customer_id: 'xero customer',
                    app_client_id: clientId || config.XERO_CLIENT_ID,
                    app_client_secret: clientSecret || config.XERO_CLIENT_SECRET,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    app_client_id: clientId || config.XERO_CLIENT_ID,
                    app_client_secret: clientSecret || config.XERO_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: 'xero customer',
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.xero, result.data.access_token, 'xero customer');

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: 'xero customer',
                redirectUrl,
            });
        } catch (error: any) {
            return processOAuthResult({
                status: false,
                error,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                redirectUrl,
            });
        }
    }
}

export default new XeroAuthHandler();