import path from 'path';
import { sanitizePath } from './sanitizePath';
import { STORAGE_ROOT } from '../core/constants';

export function buildFolderPath(rawPath: string): string {
	const safePath = sanitizePath(rawPath.toString());
	const storageDir = path.join(STORAGE_ROOT, safePath);
	// return path.join(storageDir);
	return storageDir ?? '';
}