export class GetEventsQueryBuilder {
    private userHandler: any;
    private params: any[];
    private whereConditions: any[];
    private selectClause: string;
    private fromClause: string;
    private orderBy: string;
    private mode: 'all' | 'active' = 'all';
    private targetEventId: number | null = null;
    
    constructor(userHandler: any) {
        this.userHandler = userHandler;
        this.params = [userHandler, userHandler];
        this.whereConditions = [];
        
        this.selectClause = `
            SELECT 
                e.id,
                e.name,
                e.length,
                e.is_rest,
                e.updated_at,
                s.id AS schedule_id,
                s.name AS schedule_name,
                s.is_playing AS schedule_is_playing,
                s.active_event_id AS schedule_active_event_id,
                s.event_playhead AS schedule_event_playhead,
                e.playhead,
                e.schedule_position,
                s.created_by AS schedule_owner,
                CASE 
                    WHEN e.id = s.active_event_id THEN 1 
                    ELSE 0 
                END AS is_active_event
        `;
        
        this.fromClause = `
            FROM schedules s
            INNER JOIN events e ON e.schedule_id = s.id
        `;
        
        this.orderBy = 'ORDER BY s.id, e.schedule_position';
    }

    // Count events in the schedule of a specific event
    countEventsForSchedule(): this {
        if (!this.targetEventId) {
            throw new Error('Must call eventId() before countEventsForSchedule()');
        }
        // Append the count as a subquery to the existing select clause
        this.selectClause += `,
            (SELECT COUNT(*) FROM events e2 WHERE e2.schedule_id = s.id) AS schedule_total_events`;
        this.orderBy = 'ORDER BY s.id, e.schedule_position';
        return this;
    }

    // Filter by event ID
    eventId(id: number): this {
        this.targetEventId = id;
        return this.where('e.id = ?', id);
    }
    // Only get active events (the currently playing one per schedule)
    onlyActiveEvents(): this {
        this.mode = 'active';
        this.fromClause = `
            FROM schedules s
            INNER JOIN events e ON e.id = s.active_event_id
        `;
        return this;
    }

    // Get all events (default)
    allEvents(): this {
        this.mode = 'all';
        this.fromClause = `
            FROM schedules s
            INNER JOIN events e ON e.schedule_id = s.id
        `;
        return this;
    }

    // Filter by schedule
    schedule(id: number): this {
        return this.where('s.id = ?', id);
    }

    // Filter by multiple event IDs
    eventIds(ids: number[]): this {
        if (ids.length === 0) return this;
        const placeholders = ids.map(() => '?').join(', ');
        return this.where(`e.id IN (${placeholders})`, ...ids);
    }

    // Filter by schedule playing status
    scheduleIsPlaying(value: boolean = true): this {
        return this.where('s.is_playing = ?', value ? 1 : 0);
    }

    scheduleIsStopped(): this {
        return this.where('s.is_playing = 0');
    }

    // Filter by event being the active/playing event
    isActiveEvent(value: boolean = true): this {
        if (this.mode === 'all') {
            return this.where('e.id = s.active_event_id');
        }
        return this;
    }

    // Filter by creator
    createdBy(userId: string): this {
        return this.where('s.created_by = ?', userId);
    }

    // Generic where
    where(condition: string, ...values: any[]): this {
        this.whereConditions.push(condition);
        if (values.length > 0) {
            this.params.push(...values);
        }
        return this;
    }

    // Build the query
    build(): { query: string, params: any[] } {
        const accessControl = `
            WHERE (
                s.created_by = ?
                OR EXISTS (
                    SELECT 1
                    FROM scheduleToUser stu
                    WHERE stu.schedule_id = s.id
                        AND stu.user_handler = ?
                        AND stu.access_level_id >= 1
                )
            )
        `;

        let query = this.selectClause + this.fromClause + accessControl;

        if (this.whereConditions.length > 0) {
            query += ' AND ' + this.whereConditions.join(' AND ');
        }

        query += ' ' + this.orderBy;

        return { query, params: this.params };
    }

    async execute(connection: any): Promise<any[]> {
        const { query, params } = this.build();
        const rows = await connection.execute(query, params);
        return rows;
    }
}