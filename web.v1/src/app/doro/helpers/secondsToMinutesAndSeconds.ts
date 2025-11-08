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
