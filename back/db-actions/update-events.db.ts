interface EventUpdate {
    id: number;
    name?: string;
    length?: number;
    is_rest?: boolean;
    schedule_id?: number;
    schedule_position?: number;
    playhead?: number;
}

export async function updateEventsDb(
    connection: any,
    updates: EventUpdate[]
): Promise<boolean> {

    const res: any = {
		success: false,
		result: null,
		error: null
	}

    try {
        const ids = updates.map(u => u.id);
        
        // Build dynamic CASE statements for each field
        const caseStatements: string[] = [];
        const values: any[] = [];

        // Helper to add CASE for a field
        const addCase = (field: string, getValue: (u: EventUpdate) => any) => {
            const hasValue = updates.some(u => getValue(u) !== undefined);
            if (!hasValue) return;

            const cases = updates
                .filter(u => getValue(u) !== undefined)
                .map(u => `WHEN id = ? THEN ?`)
                .join(' ');
            
            const caseValues = updates
                .filter(u => getValue(u) !== undefined)
                .flatMap(u => [u.id, getValue(u)]);

            caseStatements.push(`${field} = CASE ${cases} ELSE ${field} END`);
            values.push(...caseValues);
        };

        // Add each field
        addCase('name', u => u.name);
        addCase('length', u => u.length);
        addCase('is_rest', u => u.is_rest !== undefined ? (u.is_rest ? 1 : 0) : undefined);
        addCase('schedule_id', u => u.schedule_id);
        addCase('schedule_position', u => u.schedule_position);
        addCase('playhead', u => u.playhead);

        if (caseStatements.length === 0) {
            res.error = 'no fields to update';
        }

        // Add IDs for WHERE clause
        values.push(...ids);

        const query = `
            UPDATE events 
            SET ${caseStatements.join(', ')}
            WHERE id IN (${ids.map(() => '?').join(', ')})
        `;

        const [result] = await connection.execute(query, values);
        res.result = result;

        if(result.affectedRows > 0) {
            res.success = true;    
        }

        return res;

    } catch(error: any) {
        res.error = error.message

        return res;
    }
}