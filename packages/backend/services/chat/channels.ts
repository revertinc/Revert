import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { ChannelsService } from '../../generated/typescript/api/resources/chat/resources/channels/service/ChannelsService';
import logError from '../../helpers/logError';
import { isStandardError } from '../../helpers/error';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { unifyChannel } from '../../models/unified/channel';
import revertAuthMiddleware from '../../helpers/authMiddleware';

const channelsService = new ChannelsService(
    {
        async getChannels(req, res) {
            try {
                const connection = res.locals.connection;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET CHANNELS', tenantId, thirdPartyId);

                switch (thirdPartyId) {
                    case TP_ID.slack: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&after=${cursor}` : ''
                        }`;

                        const url = `https://slack.com/api/conversations.list?${pagingString}`;

                        let channels: any = await axios({
                            method: 'get',
                            url: url,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const nextCursor = channels.data?.response_metadata?.next_cursor || undefined;
                        channels = channels.data.channels;
                        channels = channels?.map((l: any) => unifyChannel(l));

                        res.send({ status: 'ok', next: nextCursor, results: channels });
                        break;
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch users', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { channelsService };
