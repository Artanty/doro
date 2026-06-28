import createPool from '../../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../../utils/dd';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { updateEvent } from '../../db-actions/update-event';
import { getAccessibleEvent, ACCESS_CASE } from '../../db-actions/get-accessible-event';
import { ConfigManager } from '../config-manager';
import { OuterEntry, OuterSyncService } from '../outer-sync.service';
import { deleteEvent } from '../../db-actions/delete-event';
import { buildOuterEntityId } from '../../utils/buildOuterEntityId';
import { parseServerResponse } from '../../utils/parseServerResponse';

/**
 * 1. получить event & schedule
 * 
 * Если этот ивент последний в schedule ! прикрутить events count к запросу event+schedule
 * 
 * 
 * Если этот ивент - активный в schedule
 * 1. 
 * 
 * Если этот ивент сейчас is_running
 * 1. удалить его из tik@
 * 2. остановить schedule
 * 3. удалить его из events
 * 
 
 */
export const deleteEventCtl = async (eventId: number, userHandler: string) => {
	const pool = createPool();
	const connection = await pool.getConnection();

	let 
		deleteEventResult,
		tikEventsPayload: OuterEntry[] = [],
		tikResponse
		;
	try {
		await connection.beginTransaction();

		deleteEventResult = await deleteEvent(connection, eventId);
		if (!deleteEventResult.success) {
			throw new Error(deleteEventResult.error!);
		}

		await connection.commit();

		ConfigManager.setConfigHash(); 

		const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');

		const outerEvent = { id: buildOuterEntityId('event', eventId) };
		const eventsPayload = OuterSyncService.addOuterActionInEvents(outerEvent, 'delete');
		tikEventsPayload = [...hashPayload, ...eventsPayload];
		tikResponse = await OuterSyncService.updateOuterEntries(tikEventsPayload);
			
		return {
			data: {
				success: deleteEventResult.success,
			},
			debug: {
				[thisProjectResProp()]: {
					deleteEventResult,
		
				},
				[tikResProp()]: {
					request: tikEventsPayload,
					response: tikResponse
				}
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