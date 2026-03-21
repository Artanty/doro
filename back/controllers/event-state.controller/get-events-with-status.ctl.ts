import createPool from '../../core/db_connection';
import { EVENT_TIK_ACTION_PROP } from "../../core/constants";
import { buildOuterEntityId } from "../../utils/buildOuterEntityId";
import { dd } from "../../utils/dd";
import { ConfigManager } from "../config-manager";
import { buildTikEvents } from "../helpers/build-tik-events";
import { OuterSyncService } from "../outer-sync.service";

export const getEventsWithStatusCtl = async (userHandler: any) => {
    dd('getEventsWithStatus')
    const pool = createPool();
    const connection = await pool.getConnection();
    debugger;
    try {
        const [events] = await connection.execute(
            `SELECT 
                e.id,
                e.name,
                e.length,
                e.type as event_type,
                e.event_state_id as current_state,
                e.updated_at as last_state_change,
                e.created_at,
                etu.access_level
             FROM events e
             INNER JOIN eventToUser etu ON e.id = etu.event_id
             WHERE etu.user_handler = ? AND e.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)
             ORDER BY e.created_at DESC`,
            [userHandler]            
        );
        // Process each event to determine status and current seconds
        const eventsWithStatus = await buildTikEvents(connection, events);

        const eventsWithTikAction = OuterSyncService.addOuterActionInEvents(eventsWithStatus, 'add');

        const configHashEntry = { 
            id: buildOuterEntityId('configHash', 1), // 1 - id
            cur: ConfigManager.configHash,
            [EVENT_TIK_ACTION_PROP]: 'upsert',
        };

        const productEntriesForTik: any[] = [...eventsWithTikAction, configHashEntry];

        console.log(productEntriesForTik)
        // return productEntriesForTik;
        return { 
            data: productEntriesForTik,
            debug: {
                events: JSON.stringify(events[0]),
                eventsWithStatus: JSON.stringify(eventsWithStatus[0]),
                eventsWithTikAction,
                productEntriesForTik,
            }
        }
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}
