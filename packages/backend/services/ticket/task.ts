import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import { TaskService } from '../../generated/typescript/api/resources/ticket/resources/task/service/TaskService';
import axios from 'axios';
import { UnifiedTicketTask } from '../../models/unified/ticketTask';
import { disunifyTicketObject, unifyObject } from '../../helpers/crm/transform';
import { TicketStandardObjects } from '../../constants/common';
import { LinearClient } from '@linear/sdk';

const objType = TicketStandardObjects.ticketTask;

const taskServiceTicket = new TaskService(
    {
        async getTask(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const taskId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse(req.query.fields as string);
                logInfo(
                    'Revert::GET TASK',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    taskId
                );

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });
                        const task: any = await linear.issue(taskId);
                        const state = await linear.workflowState(task._state.id);
                        let modifiedTask = { ...task, state: { name: state.name } };

                        const unifiedTask: any = await unifyObject<any, UnifiedTicketTask>({
                            obj: modifiedTask,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedTask,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        const result = await axios({
                            method: 'get',
                            url: `https://api.clickup.com/api/v2/task/${taskId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        const unifiedTask: any = await unifyObject<any, UnifiedTicketTask>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedTask,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${taskId}`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        result.data.fields.id = result.data.id;
                        const unifiedTask: any = await unifyObject<any, UnifiedTicketTask>({
                            obj: result.data.fields,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedTask,
                        });
                        break;
                    }
                    case TP_ID.trello: {
                        const card = await axios({
                            method: 'get',
                            url: `https://api.trello.com/1/cards/${taskId}?key=${connection.app_client_id}&token=${thirdPartyToken}`,
                            headers: {
                                Accept: 'application/json',
                            },
                        });

                        const unifiedTask: any = await unifyObject<any, UnifiedTicketTask>({
                            obj: card.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedTask,
                        });
                        break;
                    }
                    case TP_ID.bitbucket: {
                        if (!fields || (fields && !fields.repo && !fields.workspace)) {
                            throw new NotFoundError({
                                error: 'The query parameters "repo" and "workspace" are required and should be included in the "fields" parameter."repo" and "workspace" can either be slug or UUID.',
                            });
                        }

                        const result = await axios({
                            method: 'get',
                            url: `https://api.bitbucket.org/2.0/repositories/${fields.workspace}/${fields.repo}/issues/${taskId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedTask: any = await unifyObject<any, UnifiedTicketTask>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedTask,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch task', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getTasks(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields: any = JSON.parse(req.query.fields as string);
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;

                if (!fields || (fields && !fields.listId)) {
                    throw new NotFoundError({
                        error: 'The query parameter "listId" is required and should be included in the "fields" parameter.',
                    });
                }

                logInfo(
                    'Revert::GET ALL TASKS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    // @TODO Query won't fetch data for fields provided in additional column
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });
                        /*
                            In GraphQL, either 'first' & 'after' or 'last' & 'before' can exist but not both simultaneously.
                            To determine the appropriate pagination direction, an additional flag parameter is required.
                        */
                        const variables = {
                            first: pageSize ? pageSize : null,
                            after: cursor ? cursor : null,
                            last: null,
                            Before: null,
                            filter: {
                                team: {
                                    id: {
                                        eq: fields.listId,
                                    },
                                },
                            },
                        };
                        const result: any = await linear.issues(variables);

                        const unifiedTasks: any = await Promise.all(
                            result.nodes.map(async (task: any) => {
                                const state = await linear.workflowState(task._state.id);
                                let modifiedTask = { ...task, state: { name: state.name } };
                                return await unifyObject<any, UnifiedTicketTask>({
                                    obj: modifiedTask,
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            })
                        );
                        const pageInfo = result.pageInfo;
                        let next_cursor = undefined;
                        if (pageInfo.hasNextPage && pageInfo.endCursor) {
                            next_cursor = pageInfo.endCursor;
                        }

                        let previous_cursor = undefined;
                        if (pageInfo.hasPreviousPage && pageInfo.startCursor) {
                            previous_cursor = pageInfo.startCursor;
                        }

                        res.send({
                            status: 'ok',
                            next: next_cursor,
                            previous: previous_cursor,
                            results: unifiedTasks,
                        });

                        break;
                    }
                    case TP_ID.clickup: {
                        const pagingString = `${cursor ? `page=${cursor}` : ''}`;
                        // &statuses[]=complete
                        const result = await axios({
                            method: 'get',
                            url: `https://api.clickup.com/api/v2/list/${fields.listId}/task?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        const unifiedTasks: any = await Promise.all(
                            result.data.tasks.map(
                                async (task: any) =>
                                    await unifyObject<any, UnifiedTicketTask>({
                                        obj: task,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        const pageNumber = !result.data?.last_page
                            ? cursor
                                ? (parseInt(String(cursor)) + 1).toString()
                                : '1'
                            : undefined;

                        res.send({
                            status: 'ok',
                            next: pageNumber,
                            previous: undefined,
                            results: unifiedTasks,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        let pagingString = `${pageSize ? `&maxResults=${pageSize}` : ''}${
                            pageSize && cursor ? `&startAt=${cursor}` : ''
                        }`;

                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/search?jql=project=${fields.listId}&${pagingString}`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const unifiedTasks = await Promise.all(
                            result.data.issues.map(async (issue: any) => {
                                issue.fields.id = issue.id;
                                return await unifyObject<any, UnifiedTicketTask>({
                                    obj: issue.fields,
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            })
                        );
                        const limit = Number(result.data.maxResults);
                        const startAt = Number(result.data.startAt);
                        const total = Number(result.data.total);
                        const nextCursor = limit + startAt <= total ? String(limit + startAt) : undefined;
                        const previousCursor = startAt - limit >= 0 ? String(startAt - limit) : undefined;

                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: previousCursor,
                            results: unifiedTasks,
                        });

                        break;
                    }
                    case TP_ID.trello: {
                        // Treating board as list here
                        let pagingString = `${pageSize ? `&limit=${pageSize}` : ''}`;

                        if (cursor) {
                            pagingString = pagingString + `&before=${cursor}`;
                        }

                        let cards: any = await axios({
                            method: 'get',
                            url: `https://api.trello.com/1/boards/${fields.listId}/cards?key=${connection.app_client_id}&token=${thirdPartyToken}&${pagingString}`,
                            headers: {
                                Accept: 'application/json',
                            },
                        });
                        cards = cards.data;
                        const nextCursor = pageSize ? `${cards[cards.length - 1].id}` : undefined;
                        const unifiedTasks: any = await Promise.all(
                            cards.map(
                                async (task: any) =>
                                    await unifyObject<any, UnifiedTicketTask>({
                                        obj: task,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: undefined,
                            results: unifiedTasks,
                        });
                        break;
                    }
                    case TP_ID.bitbucket: {
                        if (!fields || (fields && !fields.repo && !fields.workspace)) {
                            throw new NotFoundError({
                                error: 'The query parameters "repo" and "workspace" are required and should be included in the "fields" parameter."repo" and "workspace" can either be slug or UUID.',
                            });
                        }
                        const pagingString = `${cursor ? `page=${cursor}` : ''}`;
                        const result = await axios({
                            method: 'get',
                            url: `https://api.bitbucket.org/2.0/repositories/${fields.workspace}/${fields.repo}/issues/${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedTasks: any = await Promise.all(
                            result.data.values.map(
                                async (task: any) =>
                                    await unifyObject<any, UnifiedTicketTask>({
                                        obj: task,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        const pageNumber = result.data?.next
                            ? cursor
                                ? (parseInt(cursor) + 1).toString()
                                : '1'
                            : undefined;

                        res.send({
                            status: 'ok',
                            next: pageNumber,
                            previous: undefined,
                            results: unifiedTasks,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch tasks', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createTask(req, res) {
            try {
                const taskData: any = req.body as unknown as UnifiedTicketTask;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);
                if (taskData && !taskData.listId) {
                    throw new Error('The parameter "listId" is required in request body.');
                }
                const task: any = await disunifyTicketObject<UnifiedTicketTask>({
                    obj: taskData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });

                logInfo('Revert::CREATE TASK', connection.app?.env?.accountId, tenantId, task);

                switch (thirdPartyId) {
                    // @TODO Query will fail if additional fields are posted
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });

                        if (task.state && task.teamId) {
                            const linearGraphqlClient = linear.client;
                            let states: any = await linearGraphqlClient.rawRequest(
                                `query Query($teamId: String!) {
                                    team(id: $teamId) {
                                        states {
                                            nodes {
                                            id
                                            name
                                            }
                                        }
                                    }
                                }`,
                                { teamId: task.teamId }
                            );
                            states = states.data.team.states.nodes;

                            const state = states.find(
                                (state: any) => String(state.name).toLowerCase() === task.state.toLowerCase()
                            );

                            task.stateId = state.id;
                            delete task.state;
                        }

                        const issueCreated = await linear.createIssue(task);
                        res.send({ status: 'ok', message: 'Linear task created', result: issueCreated });
                        break;
                    }
                    case TP_ID.clickup: {
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.clickup.com/api/v2/list/${task.listId}/task`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(task),
                        });
                        res.send({ status: 'ok', message: 'Clickup task created', result: result.data });

                        break;
                    }
                    case TP_ID.jira: {
                        if (!taskData.issueTypeId) {
                            throw new NotFoundError({
                                error: 'Jira requires issueTypeId parameter in request body.',
                            });
                        }

                        // if status exists set it to undefined or jira create will fail
                        let statusval = null;
                        if (taskData.status && task.fields.status && task.fields.status.name) {
                            statusval = task.fields.status.name;
                            task.fields.status = undefined;
                        }

                        const result = await axios({
                            method: 'post',
                            url: `${connection.tp_account_url}/rest/api/2/issue`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });

                        // status provided in request body
                        if (statusval) {
                            // since creating a transition requires id, get call for validation. Not sure if id's are same
                            const allTransitions = await axios({
                                method: 'get',
                                url: `${connection.tp_account_url}/rest/api/2/issue/${result.data.id}/transitions`,
                                headers: {
                                    Accept: 'application/json',
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            });
                            let transition = null;
                            if (statusval === 'open') {
                                transition = allTransitions.data.transitions.find(
                                    (item: any) => item.name.toLowerCase() === 'to do'
                                );
                            } else if (statusval === 'in_progress') {
                                transition = allTransitions.data.transitions.find(
                                    (item: any) => item.name.toLowerCase() === 'in progress'
                                );
                            } else if (statusval === 'closed') {
                                transition = allTransitions.data.transitions.find(
                                    (item: any) => item.name.toLowerCase() === 'done'
                                );
                            }
                            await axios({
                                method: 'post',
                                url: `${connection.tp_account_url}/rest/api/2/issue/${result.data.id}/transitions`,
                                headers: {
                                    Accept: 'application/json',
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                                data: JSON.stringify({
                                    transition: {
                                        id: transition.id,
                                    },
                                }),
                            });
                        }

                        res.send({
                            status: 'ok',
                            message: 'Task created in jira',
                            result: result.data,
                        });

                        break;
                    }
                    case TP_ID.trello: {
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.trello.com/1/cards?key=${connection.app_client_id}&token=${thirdPartyToken}`,
                            headers: {
                                Accept: 'application/json',
                            },
                            data: task,
                        });

                        res.send({
                            status: 'ok',
                            message: 'Task created in trello',
                            result: result.data,
                        });

                        break;
                    }
                    case TP_ID.bitbucket: {
                        if (!fields || (fields && !fields.repo && !fields.workspace)) {
                            throw new NotFoundError({
                                error: 'The query parameters "repo" and "workspace" are required and should be included in the "fields" parameter."repo" and "workspace" can either be slug or UUID.',
                            });
                        }
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.bitbucket.org/2.0/repositories/${fields.workspace}/${fields.repo}/issues`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(task),
                        });
                        res.send({ status: 'ok', message: 'Bitbucket task created', result: result.data });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create task', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateTask(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const taskData = req.body as unknown as UnifiedTicketTask;
                const taskId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);
                const task: any = await disunifyTicketObject<UnifiedTicketTask>({
                    obj: taskData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                logInfo('Revert::UPDATE TASK', connection.app?.env?.accountId, tenantId, taskData);

                switch (thirdPartyId) {
                    /* @TODO This might encounter issues with unrecognized patterns or schema, for instance, attempting to set 'issueID' within the request body of the 'revert' API 
                    might not conform to the expected GraphQL syntax, such as {issue: {id}}. */
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });

                        if (task.state) {
                            const linearGraphqlClient = linear.client;
                            let teamId: any = await linearGraphqlClient.rawRequest(
                                `query Issue($issueId: String!) {
                                    issue(id: $issueId) {
                                      team {
                                        id
                                      }
                                    }
                                  }`,
                                { issueId: taskId }
                            );
                            teamId = teamId.data.issue.team.id;
                            // fetch states for a teamId
                            let states: any = await linearGraphqlClient.rawRequest(
                                `query Query($teamId: String!) {
                                team(id: $teamId) {
                                  states {
                                    nodes {
                                      id
                                      name
                                    }
                                  }
                                }
                              }
                              `,
                                { teamId: teamId }
                            );

                            states = states.data.team.states.nodes;

                            const state = states.find(
                                (state: any) => String(state.name).toLowerCase() === task.state.toLowerCase()
                            );

                            task.stateId = state.id;
                            delete task.state;
                        }

                        const updatedTask = await linear.updateIssue(taskId, task);

                        res.send({
                            status: 'ok',
                            message: 'Linear Task updated',
                            result: updatedTask,
                        });

                        break;
                    }
                    case TP_ID.clickup: {
                        const result = await axios({
                            method: 'put',
                            url: `https://api.clickup.com/api/v2/task/${taskId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(task),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Clickup Task updated',
                            result: result.data,
                        });

                        break;
                    }
                    case TP_ID.jira: {
                        // if status exists set it to undefined or jira create will fail
                        let statusval = null;
                        if (task.fields.status && task.fields.status.name) {
                            statusval = task.fields.status.name;
                            task.fields.status = undefined;
                        }
                        const result: any = await axios({
                            method: 'put',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${taskId}`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });

                        // status provided in request body
                        if (statusval) {
                            // since creating a transition requires id, get call for validation. Not sure if id's are same
                            const allTransitions = await axios({
                                method: 'get',
                                url: `${connection.tp_account_url}/rest/api/2/issue/${taskId}/transitions`,
                                headers: {
                                    Accept: 'application/json',
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            });
                            let transition = null;
                            if (statusval === 'open') {
                                transition = allTransitions.data.transitions.find(
                                    (item: any) => item.name.toLowerCase() === 'to do'
                                );
                            } else if (statusval === 'in_progress') {
                                transition = allTransitions.data.transitions.find(
                                    (item: any) => item.name.toLowerCase() === 'in progress'
                                );
                            } else if (statusval === 'closed') {
                                transition = allTransitions.data.transitions.find(
                                    (item: any) => item.name.toLowerCase() === 'done'
                                );
                            }
                            await axios({
                                method: 'post',
                                url: `${connection.tp_account_url}/rest/api/2/issue/${taskId}/transitions`,
                                headers: {
                                    Accept: 'application/json',
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                                data: JSON.stringify({
                                    transition: {
                                        id: transition.id,
                                    },
                                }),
                            });
                        }

                        res.send({
                            status: 'ok',
                            message: 'Jira task updated',
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.trello: {
                        const result = await axios({
                            method: 'put',
                            url: `https://api.trello.com/1/cards/${taskId}?key=${connection.app_client_id}&token=${thirdPartyToken}`,
                            headers: {
                                Accept: 'application/json',
                            },
                            data: task,
                        });

                        res.send({
                            status: 'ok',
                            message: 'Trello Task updated',
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.bitbucket: {
                        if (!fields || (fields && !fields.repo && !fields.workspace)) {
                            throw new NotFoundError({
                                error: 'The query parameters "repo" and "workspace" are required and should be included in the "fields" parameter."repo" and "workspace" can either be slug or UUID.',
                            });
                        }
                        const result = await axios({
                            method: 'put',
                            url: `https://api.bitbucket.org/2.0/repositories/${fields.workspace}/${fields.repo}/issues/${taskId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                            data: JSON.stringify(task),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Bitbucket Task updated',
                            result: result.data,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update task', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { taskServiceTicket };
