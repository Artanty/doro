import createPool from '../core/db_connection';
import dotenv from 'dotenv';
import { getAccessLevels } from '../db-actions/get-access-levels';
import { dd } from '../utils/dd';
import { thisProjectResProp } from '../utils/getResProp';


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