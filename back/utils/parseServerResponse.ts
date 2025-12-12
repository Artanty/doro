import { Response } from 'express';
export const parseServerResponse = (res: Response) => {
	return (res as any).data
} 