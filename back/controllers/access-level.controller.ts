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
import { getAccessLevels } from '../db-actions/get-access-levels';


dotenv.config();

export class AccessLevelController {

	static async getAccessLevels() {
		const pool = createPool();
		const connection = await pool.getConnection();

		let getAccessLevelsResult;
		try {
			await connection.beginTransaction();

			getAccessLevelsResult = await getAccessLevels(connection);
			if (getAccessLevelsResult.error) {
				throw new Error(getAccessLevelsResult.error);
			}

			await connection.commit();

			return {
				data: getAccessLevelsResult.result,
				debug: {
					[thisProjectResProp()]: {
						getAccessLevelsResult
					}
				}
			};
		} catch (error) { 
			dd(error)
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}
}