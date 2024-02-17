import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { Prisma, xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../../redis/client/pubsub';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import sendIntegrationStatusError from '../../sendIntegrationstatusError';
import { OAuth } from 'oauth';
import redis from '../../../../redis/client';
const handleTrelloAuth = async ({
    account,
    clientId,
    clientSecret,
    integrationId,
    revertPublicKey,
    svixAppId,
    environmentId,
    tenantId,
    tenantSecretToken,
    response,
    request,
}: IntegrationAuthProps) => {
    const trelloClientId = clientId ? clientId : config.TRELLO_CLIENT_ID;
    const trelloClientSecret = clientId ? clientId : config.TRELLO_CLIENT_SECRET;
    const requestURL = 'https://trello.com/1/OAuthGetRequestToken';
    const accessURL = 'https://trello.com/1/OAuthGetAccessToken';
    const oauth = new OAuth(
        requestURL,
        accessURL,
        String(trelloClientId),
        String(trelloClientSecret),
        '1.0A',
        null,
        'HMAC-SHA1'
    );
    const token = String(request.query.oauth_token);
    const verifier = String(request.query.oauth_verifier);
    const tokenSecret = await redis.get(`trello_dev_oauth_token_${request.query.oauth_token}`);
    try {
        const { accessToken, accessTokenSecret }: { accessToken: string; accessTokenSecret: string } =
            await new Promise((resolve, reject) => {
                oauth.getOAuthAccessToken(
                    token,
                    String(tokenSecret),
                    verifier,
                    (error, accessToken, accessTokenSecret, _results) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({ accessToken, accessTokenSecret });
                        }
                    }
                );
            });
        await redis.setEx(`trello_dev_access_token_secret_${accessToken}`, 3600 * 24 * 10, accessTokenSecret);
        const access_creds: { access_token: string; access_secret: string } = {
            access_token: accessToken,
            access_secret: accessTokenSecret,
        };
        logInfo('OAuth creds for Trello', access_creds);
        let info: any = await new Promise((resolve, reject) => {
            oauth.getProtectedResource(
                'https://api.trello.com/1/members/me',
                'GET',
                accessToken,
                accessTokenSecret,
                (error, data, _response) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data);
                    }
                    logInfo('OAuth token info', data);
                }
            );
        });
        info = JSON.parse(info);

        await xprisma.connections.upsert({
            where: {
                id: tenantId,
            },
            update: {
                tp_access_token: String(access_creds.access_token),
                tp_refresh_token: null,
                app_client_id: clientId || config.TRELLO_CLIENT_ID,
                app_client_secret: clientSecret || config.TRELLO_CLIENT_SECRET,
                tp_id: integrationId,
                appId: account?.apps[0].id,
                tp_customer_id: String(info.id),
            },
            create: {
                id: tenantId,
                t_id: tenantId,
                tp_id: integrationId,
                tp_access_token: String(access_creds.access_token),
                app_client_id: clientId || config.TRELLO_CLIENT_ID,
                app_client_secret: clientSecret || config.TRELLO_CLIENT_SECRET,
                tp_customer_id: String(info.id),
                owner_account_public_token: revertPublicKey,
                appId: account?.apps[0].id,
                environmentId: environmentId,
            },
        });

        config.svix?.message.create(svixAppId, {
            eventType: 'connection.added',
            payload: {
                eventType: 'connection.added',
                connection: {
                    t_id: tenantId,
                    tp_id: TP_ID.trello,
                    tp_access_token: access_creds.access_token,
                    tp_customer_id: info.id,
                },
            },
            channels: [tenantId],
        });

        await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${tenantId}`, {
            publicToken: revertPublicKey,
            status: 'SUCCESS',
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tenantId: tenantId,
            tenantSecretToken,
        } as IntegrationStatusSseMessage);
        return response.send({ status: 'ok', tp_customer_id: info.id });
    } catch (error: any) {
        logError(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // The .code property can be accessed in a type-safe manner
            if (error?.code === 'P2002') {
                console.error('There is a unique constraint violation, a new user cannot be created with this email');
            }
        }
        console.error('Could not update db', error);
        return sendIntegrationStatusError({
            revertPublicKey,
            tenantSecretToken,
            response,
            tenantId: tenantId,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
        });
    }
};

export default handleTrelloAuth;