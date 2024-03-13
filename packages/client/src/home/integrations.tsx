import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { TailSpin } from 'react-loader-spinner';
import { IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Modal from '@mui/material/Modal';
import EditCredentials from './editCredentials';
import { LOCALSTORAGE_KEYS } from '../data/localstorage';
import { useApi } from '../data/hooks';

const Integrations = ({ environment }) => {
    const user = useUser();
    const { data, loading, fetch } = useApi();

    const [account, setAccount] = useState<any>();
    const [open, setOpen] = React.useState(false);
    const [appId, setAppId] = useState<string>('sfdc');

    const handleOpen = (appId: string) => {
        setAppId(appId);
        setOpen(true);
    };
    const handleClose = async ({ refetchOnClose = false }: { refetchOnClose?: boolean }) => {
        setOpen(false);
        if (refetchOnClose) {
            await fetchAccount();
        }
    };

    const fetchAccount = React.useCallback(async () => {
        const payload = {
            userId: user.user?.id,
        };
        const res = await fetch({
            url: '/internal/account',
            method: 'POST',
            payload,
        });
    }, [fetch, user.user?.id]);

    useEffect(() => {
        if (open) return;
        fetchAccount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    React.useEffect(() => {
        setAccount(data?.account);
        localStorage.setItem(LOCALSTORAGE_KEYS.privateToken, data?.account?.private_token);
    }, [data]);

    return (
        <div className="w-[80%]">
            <Box
                component="div"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0 5rem',
                    paddingTop: '120px',
                }}
                className="text-lg"
            >
                <h1 className="text-3xl font-bold mb-3">Integrations</h1>
                <span>Configure & Manage your connected apps here.</span>
            </Box>
            {loading ? (
                <div className="mt-10">
                    <TailSpin wrapperStyle={{ justifyContent: 'center' }} color="#1C1C1C" height={80} width={80} />
                </div>
            ) : (
                <>
                    {account ? (
                        <div
                            className="flex justify-between flex-wrap items-start gap-4"
                            style={{ padding: '2rem 5rem', width: '80%' }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        height: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="SFDC logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550774/Revert/image_8_2_peddol.png"
                                    />
                                    <p className="font-bold mt-4">Salesforce</p>
                                    <span>Configure your Salesforce App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('sfdc')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        height: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Hubspot logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550714/Revert/image_9_1_vilmhw.png"
                                    />
                                    <p className="font-bold mt-4">Hubspot</p>
                                    <span>Configure your Hubspot App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('hubspot')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        height: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Zoho CRM logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550788/Revert/image_10_xvb9h7.png"
                                    />
                                    <p className="font-bold mt-4">ZohoCRM</p>
                                    <span>Configure your Zoho CRM App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('zohocrm')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        height: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Pipedrive logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1688633518/Revert/PipedriveLogo.png"
                                    />
                                    <p className="font-bold mt-4">Pipedrive</p>
                                    <span>Configure your Pipedrive App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('pipedrive')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        height: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Slack logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1697800654/Revert/txfq0qixzprqniuc0wry.png"
                                    />
                                    <p className="font-bold mt-4">Slack Chat</p>
                                    <span>Configure your Slack Chat App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('slack')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        height: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Close CRM logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/Revert/o8kv3xqzoqioupz0jpnl.jpg"
                                    />
                                    <p className="font-bold mt-4">Close CRM</p>
                                    <span>Configure your Close CRM App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('closecrm')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        minHeight: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Discord logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/v1701337535/Revert/qorqmz5ggxbb5ckywmxm.png"
                                    />
                                    <p className="font-bold mt-4">Discord Chat</p>
                                    <span>Configure your Discord Chat App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('discord')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        minHeight: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Linear logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1702974919/Revert/v5e5z6afm5iepiy3cvex.png"
                                    />
                                    <p className="font-bold mt-4">Linear</p>
                                    <span>Configure your Linear Ticketing App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('linear')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        minHeight: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Clickup logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1702974919/Revert/zckjrxorttrrmyuxf1hu.png"
                                    />
                                    <p className="font-bold mt-4">Clickup</p>
                                    <span>Configure your Clickup Ticketing App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('clickup')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        minHeight: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Jira logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1702983006/Revert/szfzkoagws7h3miptezo.png"
                                    />
                                    <p className="font-bold mt-4">Jira</p>
                                    <span>Configure your Jira Ticketing App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('jira')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        minHeight: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Trello logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1705315257/Revert/abt6asvtvdqhzgadanwx.png"
                                    />
                                    <p className="font-bold mt-4">Trello</p>
                                    <span>Configure your Trello Ticketing App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('trello')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        minHeight: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="MS Dynamics Sales logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1707715552/Revert/mecum34mxpxirpi1obxd.png"
                                    />
                                    <p className="font-bold mt-4">MS Dynamics Sales</p>
                                    <span>Configure your MS Dynamics 365 Sakes App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('ms_dynamics_365_sales')}
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                        }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                    maxWidth: '340px',
                                    maxHeight: '208px',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        minHeight: 200,
                                        justifyContent: 'flex-start',
                                        position: 'relative',
                                    }}
                                >
                                    <p className="font-bold mt-4 mb-2">Request Integration</p>
                                    <span>
                                        Don't see an integration here? Let us{' '}
                                        <a
                                            href="https://discord.gg/q5K5cRhymW"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-bold underline"
                                        >
                                            know
                                        </a>{' '}
                                        and we'd have it in less than 48 hours.
                                    </span>
                                </div>
                            </Box>
                        </div>
                    ) : (
                        <>
                            <Box
                                component="div"
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '0 5rem',
                                    paddingTop: '120px',
                                }}
                                className="text-lg"
                            >
                                You don't seem to have access to the Revert, please contact us at team@revert.dev.
                            </Box>
                        </>
                    )}
                </>
            )}

            <Modal open={open} onClose={handleClose}>
                <EditCredentials
                    app={account?.environments
                        ?.find((env) => env.env === environment)
                        ?.apps?.find((a) => a.tp_id === appId)}
                    handleClose={handleClose}
                />
            </Modal>
        </div>
    );
};

export default Integrations;
