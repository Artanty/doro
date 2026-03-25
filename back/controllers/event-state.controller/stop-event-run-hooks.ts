import createPool from '../../core/db_connection';
import { addEventStateHistory } from '../../db-actions/add-event-state-history';
import { getEventStateHooksByState } from '../../db-actions/get-event-state-hooks';
import { upsertEventState } from '../../db-actions/upsert-event-state';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { ConfigManager } from '../config-manager';
import { EventStateHookController } from '../event-state-hook.controller';
import { OuterSyncService } from '../outer-sync.service';

export const stopEventRunHooksCtl = async (
	user: any, // todo: USE IT
	eventId: number,
	state: any,
) => {
	const pool = createPool();
	const connection = await pool.getConnection();
	let upsertStateResult,
		addEventStateHistoryResult,
		getEventStateHooksResult,
		runEventStateHooksResult,
		tikResponse;
	let outerEntries = [];
	try {
		await connection.beginTransaction();
			
		upsertStateResult = await upsertEventState(connection, eventId, state)
			
		if (upsertStateResult.isStateUpdated) {
			addEventStateHistoryResult = await addEventStateHistory(connection, eventId, state)    
		}
		await connection.commit();
		connection.release();
		await connection.beginTransaction();
		getEventStateHooksResult = await getEventStateHooksByState(connection, eventId, state);
			
		if (getEventStateHooksResult.success) {
			runEventStateHooksResult = await EventStateHookController.runHooks(connection, getEventStateHooksResult.hooks)
		}

		await connection.commit();

		if (runEventStateHooksResult.success) {
			outerEntries = runEventStateHooksResult.result
		}

		await ConfigManager.setConfigHash();
		const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');

		tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...outerEntries]);

		return {
			success: true,
			result: tikResponse, 
			debug: {
				[thisProjectResProp()]: {
					upsertStateResult,
					addEventStateHistoryResult,
				},
				[tikResProp()]: {
					tikRequest: [...outerEntries, ...hashPayload],
					tikResponse,
				},
			}
		};

	} catch (error) {
		await connection.rollback();
		return {
			success: false,
			error,
			debug: {
				[thisProjectResProp()]: {
					upsertStateResult,
					addEventStateHistoryResult
				},
				[tikResProp()]: {
					tikRequest: [...outerEntries],
					tikResponse,
				}
			}
		};
	} finally {
		connection.release();
	}
}