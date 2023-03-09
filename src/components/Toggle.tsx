import {
  ArrowCircleLeft,
  DotsThreeCircle,
  PauseCircle,
  PlayCircle,
} from '@phosphor-icons/react';
import { shallow } from 'zustand/shallow';
import { useStore } from '../lib/store';

export const Toggle = () => {
  const [state, start, stop, reset, toggleSettings] = useStore(
    (s) => [s.state, s.start, s.stop, s.reset, s.toggleSettings],
    shallow,
  );

  const toggle = () => {
    const nextState = state === 'idle' ? 'running' : 'idle';
    useStore.setState({ state: nextState });

    if (nextState === 'idle') return stop();

    start();
  };

  const iconClassName =
    'opacity-50 hover:opacity-75 transition-opacity duration-200 ease-in-out';

  return (
    <section className="text-zinc-100 cursor-pointer flex gap-2">
      {state !== 'idle' ? (
        <PauseCircle
          className={iconClassName}
          weight="thin"
          onClick={toggle}
          size={52}
        />
      ) : (
        <PlayCircle
          className={iconClassName}
          weight="thin"
          onClick={toggle}
          size={52}
        />
      )}
      {state === 'idle' && (
        <>
          <ArrowCircleLeft
            className={iconClassName}
            onClick={reset}
            weight="thin"
            size={52}
          />

          <DotsThreeCircle
            className={iconClassName}
            onClick={toggleSettings}
            weight="thin"
            size={52}
          />
        </>
      )}
    </section>
  );
};
