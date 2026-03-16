import { MinimalEventProps, EventStateResItem } from "../../types/event-state.types";
import { buildOuterEntityId } from "../../utils/buildOuterEntityId";
import { dd } from "../../utils/dd";
import { ensureArray } from "../../utils/ensureArray";
import { calculateEventStatus } from "./calculate-event-status.ts";

export const buildTikEvents = async (connection, events: MinimalEventProps | MinimalEventProps[]): Promise<EventStateResItem[]> => {
    events = ensureArray(events);
    dd(events)
    const eventsWithStatus = await Promise.all(
        events.map(async (eventProps: MinimalEventProps) => {
            const { result: eventStatus } = await calculateEventStatus(connection, eventProps);

            const eventType = eventProps.event_type === 3
                ? 'transition'
                : 'event'

            const res: EventStateResItem = {

                id: buildOuterEntityId(eventType, eventProps.id),
                cur: eventStatus!.currentSeconds,
                len: eventProps.length,
                stt: eventStatus!.status
            }

            return res;
        })
    );
    dd(eventsWithStatus)
    return eventsWithStatus;
}