import createPool from '../../core/db_connection';
import { thisProjectResProp } from '../../utils/getResProp';
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