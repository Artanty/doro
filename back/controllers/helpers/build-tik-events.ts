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
            const { eventStatus } = await calculateEventStatus(connection, eventProps);
            const res: EventStateResItem = {
                id: buildOuterEntityId('event', eventProps.id),
                cur: eventStatus.currentSeconds,
                len: eventProps.length,
                stt: eventStatus.status
            }

            return res;
        })
    );
    dd(eventsWithStatus)
    return eventsWithStatus;
}