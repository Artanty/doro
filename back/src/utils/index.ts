import { getTableSyncMode, boolToObjSyncMode } from './getTableSyncMode'
import { makeRangeIterator } from './makeRangeIterator'
import { readJsonFileSync } from './readJsonFileSync'
import { reorderArray } from './reorderArray'
import { getHash } from './getHash'
export { makeRangeIterator, getTableSyncMode, readJsonFileSync, reorderArray, boolToObjSyncMode, getHash }

export function dd (str: string) {
  console.log('******************')
  console.log(str)
  console.log('******************')
}