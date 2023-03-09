import { useEffect } from 'react';
import { formatTime } from '../lib/helper/formatTime';
import { useStore } from '../lib/store';

export const Timer = () => {
  const timeLeft = useStore((s) => s.timeLeft);
  const formatted = formatTime(timeLeft);

  useEffect(() => {
    document.title = `${formatted} — Pomominder`;
  }, [formatted]);

  return (
    <h2 className="select-none text-9xl text-zinc-200 font-semibold flex-shrink-0 w-max">
      {formatted}
    </h2>
  );
};
