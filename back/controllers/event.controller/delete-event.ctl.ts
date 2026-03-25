import createPool from '../../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../../utils/dd';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { updateEvent } from '../../db-actions/update-event';
import { getAccessibleEvent, ACCESS_CASE } from '../../db-actions/get-accessible-event';
import { ConfigManager } from '../config-manager';
import { OuterSyncService } from '../outer-sync.service';
import { deleteEvent } from '../../db-actions/delete-event';
import { buildOuterEntityId } from '../../utils/buildOuterEntityId';
import { parseServerResponse } from '../../utils/parseServerResponse';

export const deleteEventCtl = async (eventId: number, userHandler: string) => {
	const pool = createPool();
	const connection = await pool.getConnection();

	let getAccessibleEventResult,
		deleteEventResult;
	try {
		await connection.beginTransaction();

		getAccessibleEventResult = await getAccessibleEvent(connection, eventId, userHandler, ACCESS_CASE.DELETE);
		if (!getAccessibleEventResult.success) {
			throw new Error(getAccessibleEventResult.error!);
		}

		deleteEventResult = await deleteEvent(connection, eventId);
		if (!deleteEventResult.success) {
			throw new Error(deleteEventResult.error!);
		}

		await connection.commit();

		ConfigManager.setConfigHash(); 

		const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');

		const outerEvent = { id: buildOuterEntityId('event', eventId) };
		const eventsPayload = OuterSyncService.addOuterActionInEvents(outerEvent, 'delete');
			
		const tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...eventsPayload]);
			
		return {
			data: {
				success: deleteEventResult.success,
			},
			debug: {
				[thisProjectResProp()]: {
					getAccessibleEventResult,
					deleteEventResult
				},
				[tikResProp()]: tikResponse,
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