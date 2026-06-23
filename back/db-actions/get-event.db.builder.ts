import { DbActionResult } from "../types/db-action.types";

export interface GetEventResItem {
    "id": number
    "name": string
    "length": number
    "type": number
    "created_at": string
    "updated_at": string | null,
    "schedule_id": number,
    "schedule_position": number,
    "created_by": string, //todo remve
    "base_access_id": number //todo remve
    event_state_id: number
};

export class GetEventsQueryBuilder {
    userHandler: any;
    params: any[];
    whereConditions: any[];
    baseQuery: string;
    constructor(userHandler) {
        this.userHandler = userHandler;
        this.params = [userHandler, userHandler]; // Base params for access control
        this.whereConditions = [];
        this.baseQuery = `
            SELECT 
                s.id AS schedule_id,
                s.name AS schedule_name,
                s.is_playing,
                e.id,
                e.name,
                e.length,
                e.is_rest,
                e.schedule_position,
                e.playhead,
                s.created_by AS schedule_owner
            FROM schedules s
            INNER JOIN events e ON e.id = s.active_event_id
            WHERE (
                s.created_by = ?
                OR EXISTS (
                    SELECT *
                    FROM scheduleToUser stu
                    WHERE stu.schedule_id = s.id
                        AND stu.user_handler = ?
                        AND stu.access_level_id >= 1
                )
            )
        `;
    }

    // Add a WHERE condition
    where(condition: any, ...values) {
        this.whereConditions.push(condition);
        if (values.length > 0) {
            this.params.push(...values);
        }
        return this; // For chaining
    }

    // Convenience methods
    isPlaying(value = 1) {
        return this.where('s.is_playing = ?', value);
    }

    createdBy(userId) {
        return this.where('s.created_by = ?', userId);
    }

    eventName(name) {
        return this.where('e.name LIKE ?', `%${name}%`);
    }

    scheduleId(id) {
        return this.where('s.id = ?', id);
    }

    isRest(value = 1) {
        return this.where('e.is_rest = ?', value);
    }

    // Build the final query
    build() {
        let query = this.baseQuery;
        
        if (this.whereConditions.length > 0) {
            query += ' AND ' + this.whereConditions.join(' AND ');
        }
        
        query += ' ORDER BY s.id';
        
        return { query, params: this.params };
    }

    // Execute directly
    async execute(connection) {
        const { query, params } = this.build();
        const rows = await connection.execute(query, params);
        return rows;
    }
}