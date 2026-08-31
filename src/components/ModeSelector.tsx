import { useShallow } from 'zustand/shallow';
import { useStore } from '../lib/store';
import { Button } from './Button';

export const ModeSelector = () => {
  const [mode, setMode, state] = useStore(
    useShallow((s) => [s.mode, s.setMode, s.state]),
  );

  return (
    <section
      className={`flex gap-4 transition-opacity duration-300 ease-in-out ${
        state === 'running' ? 'opacity-0 pointer-events-none' : ''
      }`}
    >
      <Button active={mode === 'work'} onClick={() => setMode('work')}>
        Work
      </Button>

      <Button
        active={mode === 'shortBreak'}
        onClick={() => setMode('shortBreak')}
      >
        Short Break
      </Button>

      <Button
        active={mode === 'longBreak'}
        onClick={() => setMode('longBreak')}
      >
        Long Break
      </Button>
    </section>
  );
};
