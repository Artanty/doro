import { minutesToSeconds, timeStringToSeconds, hoursToSeconds, secondsToMinutesAndSeconds } from './time'
export {
  secondsToMinutesAndSeconds,
  minutesToSeconds,
  hoursToSeconds,
  timeStringToSeconds,
}

export function assureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

