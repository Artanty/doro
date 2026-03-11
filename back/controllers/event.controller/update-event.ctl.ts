import createPool from '../../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../../utils/dd';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { updateEvent } from '../../db-actions/update-event';
import { getAccessibleEvent, ACCESS_CASE } from '../../db-actions/get-accessible-event';
import { ConfigManager } from '../config-manager';
import { OuterSyncService } from '../outer-sync.service';

export const updateEventCtl = async (
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
) => {
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