export function minutesToSeconds (minutes: number): number {
  return minutes * 60
}

export function hoursToSeconds (minutes: number): number {
  return minutes * 60 * 60
}

export function timeStringToSeconds (timeString: string): number {
  // Split the time string into minutes and seconds
  const [minutes, seconds] = timeString.split(':').map(Number);

  // Convert minutes to seconds and add seconds
  return (minutes * 60) + seconds;
}

export function secondsToMinutesAndSeconds (seconds: number) {
  // Ensure the input is a non-negative number
  seconds = Math.max(0, seconds);

  // Calculate minutes and seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  // Format the result as 'mm:ss'
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

  return formattedTime;
}

export function getFormattedTime (milliseconds: number, format?: any): string {
  const totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let result = ''
  if (hours) { result = result.concat(hours.toString().padStart(2, '0') + ':') }
  if (minutes) {
    result = result.concat(minutes.toString().padStart(2, '0') + ':')
  } else {
    result = result.concat('00:')
  }
  if (seconds) {
    result = result.concat(seconds.toString().padStart(2, '0'))
  } else {
    result = result.concat('00')
  }

  return result
}
