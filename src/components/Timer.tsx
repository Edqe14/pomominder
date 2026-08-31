import { useEffect } from 'react';
import { formatTime } from '../lib/helper/formatTime';
import { hydrateSettings, useStore } from '../lib/store';

export const Timer = () => {
  const timeLeft = useStore((s) => s.timeLeft);
  const formatted = formatTime(timeLeft);

  // Stored settings land after hydration so the prerendered markup matches
  // the first render.
  useEffect(hydrateSettings, []);

  useEffect(() => {
    document.title = `${formatted} — Pomominder`;
  }, [formatted]);

  return (
    <h2 className="select-none text-9xl text-zinc-200 font-semibold shrink-0 w-max">
      {formatted}
    </h2>
  );
};
