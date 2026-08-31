const pad = (n: number) => Math.floor(n).toString().padStart(2, '0');

export const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));

  return `${pad(safe / 60)}:${pad(safe % 60)}`;
};
