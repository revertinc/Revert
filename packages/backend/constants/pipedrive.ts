// Add this interface to all pipedrive get calls
export interface PipedrivePagination {
    additional_data: {
        pagination: {
            start: number;
            limit: number;
            next_start: number;
            more_items_in_collection: boolean;
        };
    };
}

export const PipedriveLeadType = {
    PERSON: 'PERSON',
    ORGANIZATION: 'ORGANIZATION',
} as const;

export const PipedriveNoteType = {
    ...PipedriveLeadType,
    LEAD: 'LEAD',
    DEAL: 'DEAL',
} as const;

export enum PipedriveDealStatus {
    won = 'won',
    open = 'open',
    lost = 'lost',
    deleted = 'deleted',
}
