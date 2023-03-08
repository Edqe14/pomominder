import { formatTime } from '../lib/helper/formatTime';
import { useStore } from '../lib/store';

export const Timer = () => {
  const timeLeft = useStore((s) => s.timeLeft);

  return (
    <h2 className="text-9xl text-zinc-100 font-semibold flex-shrink-0 w-max">
      {formatTime(timeLeft)}
    </h2>
  );
};
