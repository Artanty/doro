import createPool from '../../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../../utils/dd';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { updateEvent } from '../../db-actions/update-event';
import { getAccessibleEvent, ACCESS_CASE } from '../../db-actions/get-accessible-event';
import { ConfigManager } from '../config-manager';
import { OuterSyncService } from '../outer-sync.service';
import { deleteFinishedEvents } from '../../db-actions/delete-finished-events';

export const deleteFinishedEventsCtl = async (
	eventType,
	eventStateId,
) => {
	const pool = createPool();
	const connection = await pool.getConnection();
	let deleteEventsResult;
		
	try {
		await connection.beginTransaction();

		deleteEventsResult = await deleteFinishedEvents(connection, eventType, eventStateId);
		if (!deleteEventsResult.success) {
			throw new Error(deleteEventsResult.error!);
		}
		
		await connection.commit();

		return {
			data: {
				success: deleteEventsResult.result,
			},
			debug: {
				[thisProjectResProp()]: {
					deleteEventsResult
				},
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