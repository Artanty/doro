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