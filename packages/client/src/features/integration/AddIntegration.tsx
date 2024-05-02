import { Box } from '@mui/material';
import Modal from '@mui/material/Modal';
import React from 'react';

const integrations = [
    {
        name: 'Hubspot',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711548892/Revert/v8xy74cep10cjuitlnpk.png',
        description: 'Configure your Hubspot App from here.',
    },
    {
        name: 'Salesforce',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711548963/Revert/by6ckdbnibuniorebwxj.png',
        description: 'Configure your Salesforce App from here.',
    },
    {
        name: 'ZohoCRM',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549106/Revert/lig4v85hfhshob9w6z9z.png',
        description: 'Configure your Zoho CRM App from here.',
    },
    {
        name: 'Pipedrive',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711548714/Revert/opggbicfjuskkxnflysm.png',
        description: 'Configure your Pipedrive App from here.',
    },
    {
        name: 'Close CRM',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711548783/Revert/mrfg9qcxzh5r2iyatjdg.png',
        description: 'Configure your Close CRM App from here.',
    },
    {
        name: 'MS Dynamics Sales',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549741/Revert/pbvr2f2yszrt5ithbirb.png',
        description: 'Configure your MS Dynamics 365 Sakes App from here.',
    },
    {
        name: 'Slack Chat',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711550376/Revert/gei0ux6iptaf1nfxjfv2.png',
        description: 'Configure your Slack Chat App from here.',
    },
    {
        name: 'Discord Chat',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711550278/Revert/sgbdv2n10bajbykvtxl4.png',
        description: 'Configure your Discord Chat App from here.',
    },
    {
        name: 'Linear',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549244/Revert/v8r7gnqe0tzoozwbhnyn.png',
        description: 'Configure your Linear Ticketing App from here.',
    },
    {
        name: 'Clickup',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549293/Revert/ooo7iegqcrdkxgrclzjt.png',
        description: 'Configure your Clickup Ticketing App from here.',
    },
    {
        name: 'Jira',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549557/Revert/tsjway6elov5bv1tc5tk.png',
        description: 'Configure your Jira Ticketing App from here.',
    },
    {
        name: 'Trello',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549291/Revert/caydzlxzcitdu2n9yuea.png',
        description: 'Configure your Trello Ticketing App from here.',
    },

    {
        name: 'Bitbucket',
        logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549311/Revert/cmqpors8m8tid9zpn9ak.png',
        description: 'Configure your Bitbucket Ticketing App from here.',
    },
];

function AddIntegration({
    values,
}: {
    values: {
        init: boolean;
        setInit: React.Dispatch<React.SetStateAction<boolean>>;
    };
}) {
    const { init, setInit } = values;
    return (
        <Modal
            open={init}
            onClose={() => setInit(false)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            sx={{ backgroundColor: '#293347', width: '70vw', margin: '10vh 20vw 10vh 20vw' }}
            className="rounded-xl overflow-scroll"
        >
            <>
                <Box component="div" sx={{ margin: '3rem' }}>
                    <h1 className="text-3xl font-bold mb-3 text-[#fff]">Create Integration</h1>
                    <span className="text-[#b1b8ba]"></span>
                </Box>
                <div className="grid grid-cols-4 gap-8 justify-center content-center mx-8">
                    {integrations.map((integration, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div
                                className="flex w-full justify-around items-center px-8 py-8 rounded-lg"
                                style={{
                                    border: '1px #3E3E3E solid',
                                }}
                            >
                                <img
                                    width={100}
                                    style={{
                                        height: 40,
                                        objectFit: 'scale-down',
                                    }}
                                    alt={`${integration.name} logo`}
                                    src={integration.logo}
                                />
                            </div>
                        </Box>
                    ))}
                </div>
            </>
        </Modal>
    );
}

export default AddIntegration;
