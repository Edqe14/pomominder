export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes
    .toFixed(Number(minutes % 1 !== 0))
    .padStart(2, '0')}:${remainingSeconds
    .toFixed(Number(remainingSeconds % 1 !== 0))
    .padStart(2, '0')}`;
};
