import axios from 'axios';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { disunifyDeal, unifyDeal } from '../models/unified';
import { ParsedQs } from 'qs';

class DealService {
    async getUnifiedDeal(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const dealId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET DEAL', tenantId, thirdPartyId, thirdPartyToken, dealId);
        if (thirdPartyId === 'hubspot') {
            let deal: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            deal = ([deal.data] as any[])?.[0];
            deal = unifyDeal({ ...deal, ...deal?.properties });
            return {
                result: deal,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const deals = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/deals/${dealId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let deal = unifyDeal(deals.data.data?.[0]);
            return { result: deal };
        } else if (thirdPartyId === 'sfdc') {
            const deals = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Opportunity/${dealId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let deal = unifyDeal(deals.data);
            return { result: deal };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedDeals(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        console.log('Revert::GET ALL DEAL', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            let deals: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/deals?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            deals = deals.data.results as any[];
            deals = deals?.map((l: any) => unifyDeal({ ...l, ...l?.properties }));
            return {
                results: deals,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let deals: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/deals?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            deals = deals.data.data;
            deals = deals?.map((l: any) => unifyDeal(l));
            return { results: deals };
        } else if (thirdPartyId === 'sfdc') {
            // TODO: Handle "ALL" for Hubspot & Zoho
            const query =
                fields === 'ALL'
                    ? 'SELECT+fields(all)+from+Opportunity+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Opportunity`;
            let deals: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            deals = deals.data?.records;
            deals = deals?.map((l: any) => unifyDeal(l));
            return { results: deals };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedDeals(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '').split(',');
        console.log('Revert::SEARCH DEAL', tenantId, searchCriteria, fields);
        if (thirdPartyId === 'hubspot') {
            let deals: any = await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/deals/search`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify({
                    ...searchCriteria,
                    properties: ['hs_deal_status', 'firstname', 'email', 'lastname', 'hs_object_id', ...fields],
                }),
            });
            deals = deals.data.results as any[];
            deals = deals?.map((l: any) => unifyDeal({ ...l, ...l?.properties }));
            return {
                status: 'ok',
                results: deals,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let deals: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/deals/search?criteria=${searchCriteria}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            deals = deals.data.data;
            deals = deals?.map((l: any) => unifyDeal(l));
            return { status: 'ok', results: deals };
        } else if (thirdPartyId === 'sfdc') {
            let deals: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            deals = deals?.data?.searchRecords;
            deals = deals?.map((l: any) => unifyDeal(l));
            return { status: 'ok', results: deals };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async createDeal(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const deal = disunifyDeal(req.body, thirdPartyId);
        console.log('Revert::CREATE DEAL', tenantId, deal);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/deals/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return {
                status: 'ok',
                message: 'Hubspot deal created',
                result: deal,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/deals`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return { status: 'ok', message: 'Zoho deal created', result: deal };
        } else if (thirdPartyId === 'sfdc') {
            const dealCreated = await axios({
                method: 'post',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Opportunity/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return {
                status: 'ok',
                message: 'SFDC deal created',
                result: dealCreated.data,
            };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async updateDeal(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const deal = disunifyDeal(req.body, thirdPartyId);
        const dealId = req.params.id;
        console.log('Revert::UPDATE DEAL', tenantId, deal, dealId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return {
                status: 'ok',
                message: 'Hubspot deal created',
                result: deal,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/deals/${dealId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return { status: 'ok', message: 'Zoho deal updated', result: deal };
        } else if (thirdPartyId === 'sfdc') {
            await axios({
                method: 'patch',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Opportunity/${dealId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return { status: 'ok', message: 'SFDC deal updated', result: deal };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new DealService();
