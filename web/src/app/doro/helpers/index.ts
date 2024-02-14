import { secondsToMinutesAndSeconds } from './secondsToMinutesAndSeconds'
import { minutesToSeconds } from './minutesToSeconds'
export { secondsToMinutesAndSeconds, minutesToSeconds }


export function assureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export function deleteProps <T extends object, K extends keyof T & string>(obj: T, props: K | K[]): Partial<T> {
  assureArray(props).forEach(prop => {
    if (obj.hasOwnProperty(prop)) {
      delete obj[prop];
    }
  });
  return obj
}
