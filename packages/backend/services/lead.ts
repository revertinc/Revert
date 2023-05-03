import axios from 'axios';
import { disunifyLead, unifyLead } from '../models/unified/lead';
import { filterLeadsFromContactsForHubspot } from '../helpers/filterLeadsFromContacts';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

class LeadService {
    async getUnifiedLead(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const leadId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET LEAD', tenantId, thirdPartyId, thirdPartyToken, leadId);
        if (thirdPartyId === 'hubspot') {
            let lead: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/${leadId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            lead = filterLeadsFromContactsForHubspot([lead.data] as any[])?.[0];
            return {
                result: unifyLead({ ...lead, ...lead?.properties }),
            };
        } else if (thirdPartyId === 'zohocrm') {
            const leads = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads/${leadId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let lead = leads.data.data?.[0];
            return { result: unifyLead(lead) };
        } else if (thirdPartyId === 'sfdc') {
            const leads = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Lead/${leadId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let lead = leads.data;
            return { result: unifyLead(lead) };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedLeads(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        console.log('Revert::GET ALL LEADS', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            let leads: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/contacts?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            leads = filterLeadsFromContactsForHubspot(leads.data.results as any[]);
            leads = leads?.map((l: any) => unifyLead({ ...l, ...l?.properties }));
            return {
                results: leads,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let leads: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            leads = leads.data.data;
            leads = leads?.map((l: any) => unifyLead(l));
            return { results: leads };
        } else if (thirdPartyId === 'sfdc') {
            // TODO: Handle "ALL" for Hubspot & Zoho
            const query =
                fields === 'ALL'
                    ? 'SELECT+fields(all)+from+Lead+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Lead`;
            let leads: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            leads = leads.data?.records;
            leads = leads?.map((l: any) => unifyLead(l));
            return { results: leads };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedLeads(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '').split(',');
        console.log('Revert::SEARCH LEAD', tenantId, searchCriteria, fields);
        if (thirdPartyId === 'hubspot') {
            let leads: any = await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/search`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify({
                    ...searchCriteria,
                    properties: ['hs_lead_status', 'firstname', 'email', 'lastname', 'hs_object_id', ...fields],
                }),
            });
            leads = filterLeadsFromContactsForHubspot(leads.data.results as any[]);
            leads = leads?.map((l: any) => unifyLead({ ...l, ...l?.properties }));
            return {
                status: 'ok',
                results: leads,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let leads: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads/search?criteria=${searchCriteria}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            leads = leads.data.data;
            leads = leads?.map((l: any) => unifyLead(l));
            return { status: 'ok', results: leads };
        } else if (thirdPartyId === 'sfdc') {
            let leads: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            leads = leads?.data?.searchRecords;
            leads = leads?.map((l: any) => unifyLead(l));
            return { status: 'ok', results: leads };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async createLead(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const lead = disunifyLead(req.body, thirdPartyId);
        console.log('Revert::CREATE LEAD', tenantId, lead);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return {
                status: 'ok',
                message: 'Hubspot lead created',
                result: lead,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/Leads`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return { status: 'ok', message: 'Zoho lead created', result: lead };
        } else if (thirdPartyId === 'sfdc') {
            const leadCreated = await axios({
                method: 'post',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Lead/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return {
                status: 'ok',
                message: 'SFDC lead created',
                result: leadCreated.data,
            };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async updateLead(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const lead = disunifyLead(req.body, thirdPartyId);
        const leadId = req.params.id;
        console.log('Revert::UPDATE LEAD', tenantId, lead, leadId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/${leadId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return {
                status: 'ok',
                message: 'Hubspot lead created',
                result: lead,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/Leads/${leadId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return { status: 'ok', message: 'Zoho lead updated', result: lead };
        } else if (thirdPartyId === 'sfdc') {
            await axios({
                method: 'patch',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Lead/${leadId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return { status: 'ok', message: 'SFDC lead updated', result: lead };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new LeadService();
