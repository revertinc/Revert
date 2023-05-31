import axios from 'axios';
import { unifyCompany, disunifyCompany } from '../models/unified/company';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

class CompanyService {
    async getUnifiedCompany(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const companyId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET COMPANY', tenantId, thirdPartyId, thirdPartyToken, companyId);
        if (thirdPartyId === 'hubspot') {
            const company = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });

            return {
                result: unifyCompany({ ...company.data, ...company.data?.properties }),
            };
        } else if (thirdPartyId === 'zohocrm') {
            let company: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Accounts/${companyId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            company = unifyCompany(company.data.data?.[0]);
            return { result: company };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const company = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Account/${companyId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            return { result: unifyCompany(company.data) };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedCompanies(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        const pageSize = parseInt(String(req.query.pageSize));
        const cursor = req.query.cursor;
        console.log('Revert::GET ALL COMPANIES', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&after=${cursor}` : ''}`;
            let companies: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/companies?properties=${fields}&${pagingString}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = companies.data?.paging?.next?.after || null;
            companies = companies.data.results as any[];
            companies = companies?.map((c: any) => unifyCompany({ ...c, ...c?.properties }));
            return {
                next: nextCursor,
                previous: null, // Field not supported by Hubspot.
                results: companies,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${cursor ? `&page_token=${cursor}` : ''}`;
            let companies: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Accounts?fields=${fields}${pagingString}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            const nextCursor = companies.data?.info?.next_page_token || null;
            const prevCursor = companies.data?.info?.previous_page_token || null;
            companies = companies.data.data;
            companies = companies?.map((l: any) => unifyCompany(l));
            return { next: nextCursor, previous: prevCursor, results: companies };
        } else if (thirdPartyId === 'sfdc') {
            let pagingString = `${pageSize ? `ORDER+BY+Id+DESC+LIMIT+${pageSize}+` : ''}${
                cursor ? `OFFSET+${cursor}` : ''
            }`;
            if (!pageSize && !cursor) {
                pagingString = 'LIMIT 200';
            }
            const instanceUrl = connection.tp_account_url;
            // NOTE: Handle "ALL" for Hubspot & Zoho
            const query =
                !fields || fields === 'ALL'
                    ? `SELECT+fields(all)+from+Account+${pagingString}`
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Account+${pagingString}`;
            let companies: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = pageSize ? String(companies.data?.totalSize + (parseInt(String(cursor)) || 0)) : null;
            const prevCursor =
                cursor && parseInt(String(cursor)) > 0
                    ? String(parseInt(String(cursor)) - companies.data?.totalSize)
                    : null;
            companies = companies.data?.records;
            companies = companies?.map((l: any) => unifyCompany(l));
            return { next: nextCursor, previous: prevCursor, results: companies };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedCompanies(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '').split(',');
        console.log('Revert::SEARCH COMPANY', tenantId, searchCriteria, fields);
        if (thirdPartyId === 'hubspot') {
            let companies: any = await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/companies/search`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify({
                    ...searchCriteria,
                    properties: ['name', 'hs_object_id', ...fields],
                }),
            });
            companies = companies.data.results as any[];
            companies = companies?.map((c: any) => unifyCompany({ ...c, ...c?.properties }));
            return {
                status: 'ok',
                results: companies,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let companies: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Accounts/search?criteria=${searchCriteria}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            companies = companies.data.data;
            companies = companies?.map((c: any) => unifyCompany(c));
            return { status: 'ok', results: companies };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            let companies: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            companies = companies?.data?.searchRecords;
            companies = companies?.map((c: any) => unifyCompany(c));
            return { status: 'ok', results: companies };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async createCompany(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const company = disunifyCompany(req.body, thirdPartyId);
        console.log('Revert::CREATE COMPANY', tenantId, company);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/companies/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(company),
            });
            return {
                status: 'ok',
                message: 'Hubspot company created',
                result: company,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/Accounts`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(company),
            });
            return { status: 'ok', message: 'Zoho company created', result: company };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const companyCreated = await axios({
                method: 'post',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Account/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(company),
            });
            return {
                status: 'ok',
                message: 'SFDC company created',
                result: companyCreated.data,
            };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async updateCompany(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const company = disunifyCompany(req.body, thirdPartyId);
        const companyId = req.params.id;
        console.log('Revert::UPDATE COMPANY', tenantId, company, companyId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(company),
            });
            return {
                status: 'ok',
                message: 'Hubspot company updated',
                result: company,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/Accounts/${companyId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(company),
            });
            return { status: 'ok', message: 'Zoho company updated', result: company };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            await axios({
                method: 'patch',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Account/${companyId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(company),
            });
            return { status: 'ok', message: 'SFDC company updated', result: company };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new CompanyService();
