import { dd } from "../utils/dd";
import { DbActionResult } from "./create-event";

export const getAccessLevels = async (connection): Promise<DbActionResult> => {
	const res = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [queryResult] = await connection.execute(
			'SELECT * from accessLevels', []
		);
                
		res.success = true;
		res.result = queryResult;

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message
		
		return res;
	}
}