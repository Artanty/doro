import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";

interface DbActionResult {
	success: boolean;
	result: any;
	error: null | string;
}

export const updateEvent = async (
	connection: any, 
	eventId: number,
	updates: {
		name?: string,
		length?: number,
		type?: number,
		schedule_id?: number | null,
		schedule_position?: number | null,
		base_access_id?: number
	},
	userHandler: string
): Promise<DbActionResult> => {

	const res: DbActionResult = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		// Build dynamic UPDATE query
		const updateFields: string[] = [];
		const updateValues: any[] = [];
		const updatedAt = getUTCDatetime();

		// Always update updated_at
		updateFields.push('updated_at = ?');
		updateValues.push(updatedAt);

		// Add each provided field to update
		if (updates.name !== undefined) {
			updateFields.push('name = ?');
			updateValues.push(updates.name);
		}
		if (updates.length !== undefined) {
			updateFields.push('length = ?');
			updateValues.push(updates.length);
		}
		if (updates.type !== undefined) {
			updateFields.push('type = ?');
			updateValues.push(updates.type);
		}
		if (updates.schedule_id !== undefined) {
			updateFields.push('schedule_id = ?');
			updateValues.push(updates.schedule_id);
		}
		if (updates.schedule_position !== undefined) {
			updateFields.push('schedule_position = ?');
			updateValues.push(updates.schedule_position);
		}
		if (updates.base_access_id !== undefined) {
			updateFields.push('base_access_id = ?');
			updateValues.push(updates.base_access_id);
		}

		// If not only updated_at is updating
		if (updateFields.length !== 1) {
			const query = `UPDATE events SET ${updateFields.join(', ')} WHERE id = ?`;
			updateValues.push(eventId);

			const [queryResult] = await connection.execute(query, updateValues);
			
			res.result = queryResult.affectedRows > 0;
			res.success = true;
		}

		return res;

	} catch (error: any) {
		dd(error.message);
		res.error = error.message;
		return res;
	}
}

