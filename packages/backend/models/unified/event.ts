export interface UnifiedEvent {
    type: string;
    subject: string;
    startDateTime: string;
    endDateTime: string;
    isAllDayEvent: boolean;
    description: string;
    id: string;
    location: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: any; // TODO: Support associations
    additional?: any; // TODO: Handle additional fields
}

export function unifyEvent(event: any): UnifiedEvent {
    const unifiedEvent: UnifiedEvent = {
        remoteId: event.id || event.Id,
        id: event.id || event.eventID || event.event_id,
        createdTimestamp: event.createdDate || event.CreatedDate || event.Created_Time || event.hs_timestamp,
        updatedTimestamp: event.lastModifiedDate || event.LastModifiedDate || event.Modified_Time,
        type: event.type || event.Type || event.hs_activity_type,
        subject: event.subject || event.Subject,
        description: event.description || event.Description || event.hs_meeting_body,
        isAllDayEvent: event.All_day || event.isAllDay,
        startDateTime: event.Start_DateTime || event.hs_meeting_start_time,
        endDateTime: event.End_DateTime || event.hs_meeting_end_time,
        location: event.hs_meeting_location || event.location || event.Location,
    };

    // Map additional fields
    Object.keys(event).forEach((key) => {
        if (!(key in unifiedEvent)) {
            unifiedEvent['additional'][key] = event[key];
        }
    });

    return unifiedEvent;
}

export function toSalesforceEvent(unified: UnifiedEvent): any {
    const salesforceEvent: any = {
        Id: unified.remoteId,
        Type: unified.type,
        Subject: unified.subject,
        Start_DateTime: unified.startDateTime,
        End_DateTime: unified.endDateTime,
        All_day: unified.isAllDayEvent,
        Location: unified.location,
        Description: unified.description,
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            salesforceEvent[key] = unified.additional?.[key];
        });
    }
    return salesforceEvent;
}

export function toZohoEvent(unified: UnifiedEvent): any {
    const zoho: any = {};
    zoho.Type = unified.type;
    zoho.id = unified.remoteId;
    zoho.Subject = unified.subject;
    zoho.Start_DateTime = unified.startDateTime;
    zoho.End_DateTime = unified.endDateTime;
    zoho.All_day = unified.isAllDayEvent;
    zoho.Location = unified.location;
    zoho.Description = unified.description;

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            zoho[key] = unified.additional?.[key];
        });
    }
    return zoho;
}

export function toHubspotEvent(unifiedEvent: UnifiedEvent): any {
    const hubspotEvent: any = {
        hs_object_id: unifiedEvent.remoteId,
        hs_activity_type: unifiedEvent.type,
        subject: unifiedEvent.subject,
        hs_meeting_start_time: unifiedEvent.startDateTime,
        hs_meeting_end_time: unifiedEvent.endDateTime,
        hs_meeting_location: unifiedEvent.location,
        hs_meeting_body: unifiedEvent.description,
        isAllDay: unifiedEvent.isAllDayEvent,
    };

    // Map custom fields
    if (unifiedEvent.additional) {
        Object.keys(unifiedEvent.additional).forEach((key) => {
            hubspotEvent[key] = unifiedEvent.additional?.[key];
        });
    }

    return hubspotEvent;
}

export function disunifyEvent(deal: UnifiedEvent, integrationId: string): any {
    if (integrationId === 'sfdc') {
        return toSalesforceEvent(deal);
    } else if (integrationId === 'hubspot') {
        return toHubspotEvent(deal);
    } else if (integrationId === 'zohocrm') {
        return toZohoEvent(deal);
    }
}
