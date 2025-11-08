import createPool from '../core/db_connection';

export class EventTypeController {

	static async createEventType(name: string) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			const [result] = await connection.execute(
				'INSERT INTO eventTypes (name) VALUES (?)',
				[name]
			);
			return result.insertId;
		} catch (error) { 
			console.log(error)
			throw error;
		} finally {
			connection.release();
		}
	}

	// Get all event types
	static async getAllEventTypes() {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			const [rows] = await connection.execute(
				'SELECT * FROM eventTypes ORDER BY created_at DESC'
			);
			return rows;
		} catch (error) { 
			console.log(error)
			throw error;
		} finally {
			connection.release();
		}
	}

	static async updateEventType(eventTypeId: number, name: string) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			const [result] = await connection.execute(
				'UPDATE eventTypes SET name = ? WHERE id = ?',
				[name, eventTypeId]
			);
			return result.affectedRows > 0;
		} catch (error) { 
			console.log(error)
			throw error;
		} finally {
			connection.release();
		}
	}

	// Delete event type (with check for existing events)
	static async deleteEventType(eventTypeId: number) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// // Check if any events are using this event type
			// const [eventsUsingType] = await connection.execute(
			// 	'SELECT COUNT(*) as eventCount FROM events WHERE type = ?',
			// 	[eventTypeId]
			// );

			// if (eventsUsingType[0].eventCount > 0) {
			// 	throw new Error('Cannot delete event type: there are events using this type');
			// }

			// Delete event type
			const [result] = await connection.execute(
				'DELETE FROM eventTypes WHERE id = ?',
				[eventTypeId]
			);

			await connection.commit();
			return result.affectedRows > 0;
		} catch (error) { 
			console.log(error)
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}
}