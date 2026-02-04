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
import { upsertEventState } from '../db-actions/upsert-event-state';
import { ConfigManager } from './config-manager';
import { OuterSyncService } from './outer-sync.service';
import { ACCESS_CASE, getAccessibleEvent } from '../db-actions/get-accessible-event';
import { createEvent } from '../db-actions/create-event';
import { upsertEventAccess } from '../db-actions/upsert-event-access';
import { updateEvent } from '../db-actions/update-event';

dotenv.config();

/**
 * v2.1: initial state - only eventProgress.STOPPED
 * тотлько пользователь может запускать ивенты.
 * */
export class EventController {
	static async createEvent(
		name: string, 
		length: number, 
		type: number, 
		userHandler: string,
		base_access: number,
		state: number
	) {
		const pool = createPool();
		const connection = await pool.getConnection();

		let createEventResult,
			upsertEventAccessResult,
			upsertEventStateResult;
		try {
			await connection.beginTransaction();

			createEventResult = await createEvent(connection, name, length, type, userHandler, base_access);
			if (createEventResult.error) {
				throw new Error(createEventResult.error);
			}
			const eventId = createEventResult.result;

			upsertEventAccessResult = await upsertEventAccess(connection, eventId, userHandler, 3);

			upsertEventStateResult = await upsertEventState(connection, eventId, state) // todo add false return if no updated

			/**
			 * Нужно чтобы doro@web подтянул новое cобытие.
			 * Для этого обновляем хэш, который doro@web впоследствии получит от tik@web
			 * */
			ConfigManager.setConfigHash(); 
			/**
			 * Стейт события нужно передать в tik@, чтобы отобразился прогресс.
			 * Передаем обе сущности в одном запросе.
			 * v2: проверять, нужно ли сейчас отправлять это событие или оно не актуальное.
			 * */
			const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
			const eventsPayload = OuterSyncService.buildNewOuterEventPayload(eventId, length, state);
			await OuterSyncService.updateOuterEntries([...hashPayload, ...eventsPayload]);

			await connection.commit();
			return {
				data: {
					id: eventId
				},
			};
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
			// todo: remove eventTypes join for initial load ditionary
			const [rows] = await connection.execute(
				// `SELECT 
				// 	e.*, 
				// 	et.name as type_name, 
				// 	etu.access_level 
				//  FROM events e
				//  INNER JOIN eventTypes et ON e.type = et.id
				//  INNER JOIN eventToUser etu ON e.id = etu.event_id
				//  WHERE etu.user_handler = ? 
				//  ORDER BY e.created_at DESC`,
				// [userHandler]

				// todo: разделить запрос своих ивентов и шаредных?
				`SELECT e.*, et.name as type_name, etu.access_level,
			           CASE 
			               WHEN e.base_access_id IN (1, 2, 3) THEN TRUE
			               ELSE FALSE
			           END as has_access
			    FROM events e
			    INNER JOIN eventTypes et ON e.type = et.id
			    LEFT JOIN eventToUser etu 
			        ON e.id = etu.event_id AND etu.user_handler = ?
			    ORDER BY e.created_at DESC`,
				[userHandler]
			);
			return {
				data: rows,
				debug: {
					[thisProjectResProp()]: {
						data: rows,
					},
				}
			}
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
	static async updateEvent(
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
	) {
		const pool = createPool();
		const connection = await pool.getConnection();
		let getAccessibleEventResult,
			updateOuterEntriesResult;
		try {
			await connection.beginTransaction();

			getAccessibleEventResult = await getAccessibleEvent(connection, eventId, userHandler, ACCESS_CASE.UPDATE);
			if (!getAccessibleEventResult.success) {
				throw new Error(getAccessibleEventResult.error!);
			}
// todo mb just try to update using userHandler?
			const updateEventResult = await updateEvent(connection, eventId, updates, userHandler);

			await connection.commit();
			
			if (updateEventResult.success) {
				ConfigManager.setConfigHash(); 
				const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
				dd(hashPayload)
				updateOuterEntriesResult = await OuterSyncService.updateOuterEntries(hashPayload);
			}

			return {
				data: {
					success: updateEventResult.result,
				},
				debug: {
					[thisProjectResProp()]: {
						getAccessibleEventResult,
						updateEventResult,
					},
					[tikResProp()]: {
						updateOuterEntriesResult
					}
				}
			}
        
		} catch (error) {
			console.log(error);
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}
	// Delete event (only if user has owner access)
	static async deleteEvent(eventId: number, userHandler: string) {
		let getAccessibleEventResult;

		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// // Check if user has owner access
			// const [accessRows] = await connection.execute(
			// 	`SELECT access_level FROM eventToUser 
			// 	 WHERE event_id = ? AND user_handler = ? 
			// 	 AND access_level = 'owner'`,
			// 	[eventId, userHandler]
			// );

			// if (accessRows.length === 0) {
			// 	throw new Error('Only owner can delete event');
			// }

			getAccessibleEventResult = await getAccessibleEvent(connection, eventId, userHandler, ACCESS_CASE.DELETE);
			if (!getAccessibleEventResult.success) {
				throw new Error(getAccessibleEventResult.error!);
			}

			// Delete event (eventToUser entries will be automatically deleted due to ON DELETE CASCADE)
			const [result] = await connection.execute(
				'DELETE FROM events WHERE id = ?',
				[eventId]
			);

			await connection.commit();

			ConfigManager.setConfigHash(); 

			const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');

			const outerEvent = { id: buildOuterEntityId('event', eventId) };
			const eventsPayload = OuterSyncService.addOuterActionInEvents(outerEvent, 'delete');
			
			const tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...eventsPayload]);
			
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