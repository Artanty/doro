import path from 'path';

export const STORAGE_ROOT = path.join(__dirname, '..', 'storage');

export const CORE_BADGE = 'CORE'

export const MS_TIME = {
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
  WEEK: 604800000,
  MONTH: 2592000000
}

export enum eventProgress {
  'STOPPED' = 0,
  'PLAYING' = 1,
  'PAUSED' = 2,
  'COMPLETED' = 3
}

export const basicEventTypePrefix = 'e';