import createPool from '../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../utils/dd';
import { ensureArray } from '../utils/ensureArray';
import { EventStateController } from './eventStateController';
import { buildOuterEntityId } from '../utils/buildOuterEntityId';
import { parseServerResponse } from '../utils/parseServerResponse';
import { thisProjectResProp, tikResProp } from '../utils/getResProp';
import { getUTCDatetime } from '../utils/get-utc-datetime';

// export interface eventProps {
// 	"id": 18,
//         "name": "Morning Focus 2",
//         "length": 25,
//         "type": 2,
//         "created_at": "2025-12-12T08:49:43.000Z",
//         "type_name": "Работа",
//         "access_level": "owner"
// }

dotenv.config();

export class EventController {
	// Create event and assign owner access
	static async createEvent(name: string, length: number, type: number, userHandle: string) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// Insert event
			const [eventResult] = await connection.execute(
				'INSERT INTO events (name, length, type, created_at) VALUES (?, ?, ?, ?)',
				[name, length, type, getUTCDatetime()]
			);
			const eventId = eventResult.insertId;

			// Create owner relationship in eventToUser
			await connection.execute(
				'INSERT INTO eventToUser (event_id, user_handler, access_level, created_at) VALUES (?, ?, ?, ?)',
				[eventId, userHandle, 'owner', getUTCDatetime()]
			);

			await connection.execute(
				`INSERT INTO eventState (eventId, state, created_at, updated_at) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE eventId = ?`,
				[eventId, "2", getUTCDatetime(), getUTCDatetime(), eventId]
			);

			await connection.commit();
			return eventId;
		} catch (error) { 
			console.log(error)
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	// Get all events for a user
	static async getUserEvents(userHandler: string) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			const [rows] = await connection.execute(
				`SELECT e.*, et.name as type_name, etu.access_level 
				 FROM events e
				 INNER JOIN eventTypes et ON e.type = et.id
				 INNER JOIN eventToUser etu ON e.id = etu.event_id
				 WHERE etu.user_handler = ? 
				 ORDER BY e.created_at DESC`,
				[userHandler]
			);
			return rows;
		} catch (error) { 
			console.log(error)
			throw error;
		} finally {
			connection.release();
		}
	}

	// Get specific event by ID (with access check)
	static async getEventById(userHandler: string, eventId: number) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			const [rows] = await connection.execute(
				`SELECT e.*, et.name as type_name, etu.access_level 
				 FROM events e
				 INNER JOIN eventTypes et ON e.type = et.id
				 INNER JOIN eventToUser etu ON e.id = etu.event_id
				 WHERE e.id = ? AND etu.user_handler = ?`,
				[eventId, userHandler]
			);
			return rows.length > 0 ? rows[0] : null;
		} catch (error) { 
			console.log(error)
			throw error;
		} finally {
			connection.release();
		}
	}

	// Update event
	static async updateEvent(eventId: number, name: string, length: number, type: number, userHandle: string) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// Check if user has editor or owner access
			const [accessRows] = await connection.execute(
				`SELECT access_level FROM eventToUser 
				 WHERE event_id = ? AND user_handler = ? 
				 AND access_level IN ('editor', 'owner')`,
				[eventId, userHandle]
			);

			if (accessRows.length === 0) {
				throw new Error('Insufficient permissions to update event');
			}

			// Update event
			const [result] = await connection.execute(
				'UPDATE events SET name = ?, length = ?, type = ? WHERE id = ?',
				[name, length, type, eventId]
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

	// Delete event (only if user has owner access)
	static async deleteEvent(eventId: number, userHandle: string) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// Check if user has owner access
			const [accessRows] = await connection.execute(
				`SELECT access_level FROM eventToUser 
				 WHERE event_id = ? AND user_handler = ? 
				 AND access_level = 'owner'`,
				[eventId, userHandle]
			);

			if (accessRows.length === 0) {
				throw new Error('Only owner can delete event');
			}

			// Delete event (eventToUser entries will be automatically deleted due to ON DELETE CASCADE)
			const [result] = await connection.execute(
				'DELETE FROM events WHERE id = ?',
				[eventId]
			);

			await connection.commit();


			const minimalEventForTikAction = { id: buildOuterEntityId('event', eventId) };
			const updateEventsStatePayloadData = EventStateController.addTikActionForEvents(minimalEventForTikAction, 'delete');
			// request to tik@back
			let tikResponse;
			try {
				tikResponse = await axios.post(`${process.env['TIK_BACK_URL']}/updateEventsState`,
					{
						poolId: 'current_user_id',
						data: updateEventsStatePayloadData,
						projectId: 'doro@web',

						// requesterProject,
						// requesterApiKey: apiKeyHeader,
						// requesterUrl
					}
					// ,
					//  {
					//   headers: {
					//     'X-Project-Id': process.env.PROJECT_ID,
					//     'X-Project-Domain-Name': `${req.protocol}://${req.get('host')}`,
					//     'X-Api-Key': process.env.BASE_KEY
					//   }
					// }
				);
			} catch (error: any) {
				console.error('process.env[TIK_BACK_URL]/updateEventsState error:', error.message);
				throw new Error(error);
			}


			return {
				data: {
					success: result.affectedRows > 0,
					ids: [eventId]
				},
				debug: {
					[thisProjectResProp()]: {
						success: result.affectedRows > 0,
						ids: [eventId]
					},
					[tikResProp()]: parseServerResponse(tikResponse),
				}
			}
		} catch (error) { 
			console.log(error)
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	// // Share event with another user
	// static async shareEvent(eventId: number, targetUserHandle: string, accessLevel: string, ownerHandle: string) {
	// 	const pool = createPool();
	// 	const connection = await pool.getConnection();
	// 	try {
	// 		await connection.beginTransaction();

	// 		// Verify owner has owner access
	// 		const [ownerAccess] = await connection.execute(
	// 			`SELECT access_level FROM eventToUser 
	// 			 WHERE event_id = ? AND user_handler = ? 
	// 			 AND access_level = 'owner'`,
	// 			[eventId, ownerHandle]
	// 		);

	// 		if (ownerAccess.length === 0) {
	// 			throw new Error('Only owner can share event');
	// 		}

	// 		// Check if user already has access
	// 		const [existingAccess] = await connection.execute(
	// 			'SELECT id FROM eventToUser WHERE event_id = ? AND user_handler = ?',
	// 			[eventId, targetUserHandle]
	// 		);

	// 		if (existingAccess.length > 0) {
	// 			// Update existing access
	// 			await connection.execute(
	// 				'UPDATE eventToUser SET access_level = ? WHERE event_id = ? AND user_handler = ?',
	// 				[accessLevel, eventId, targetUserHandle]
	// 			);
	// 		} else {
	// 			// Create new access
	// 			await connection.execute(
	// 				'INSERT INTO eventToUser (event_id, user_handler, access_level) VALUES (?, ?, ?)',
	// 				[eventId, targetUserHandle, accessLevel]
	// 			);
	// 		}

	// 		await connection.commit();
	// 		return true;
	// 	} catch (error) { 
	// 		console.log(error)
	// 		await connection.rollback();
	// 		throw error;
	// 	} finally {
	// 		connection.release();
	// 	}
	// }

	// // Get events by type
	// static async getEventsByType(eventTypeId: number, userHandle: string) {
	// 	const pool = createPool();
	// 	const connection = await pool.getConnection();
	// 	try {
	// 		const [rows] = await connection.execute(
	// 			`SELECT e.*, et.name as type_name, etu.access_level 
	// 			 FROM events e
	// 			 INNER JOIN eventTypes et ON e.type = et.id
	// 			 INNER JOIN eventToUser etu ON e.id = etu.event_id
	// 			 WHERE e.type = ? AND etu.user_handler = ?
	// 			 ORDER BY e.created_at DESC`,
	// 			[eventTypeId, userHandle]
	// 		);
	// 		return rows;
	// 	} catch (error) { 
	// 		console.log(error)
	// 		throw error;
	// 	} finally {
	// 		connection.release();
	// 	}
	// }
}