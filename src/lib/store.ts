import { create } from 'zustand';
import { combine } from 'zustand/middleware';

export type Mode = 'work' | 'shortBreak' | 'longBreak';
export type State = 'idle' | 'running';

// Parse local storage

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNaNOrDefault = (val: any, def: number) => {
  // eslint-disable-next-line no-restricted-globals
  if (!val || isNaN(val)) {
    return def;
  }

  return parseInt(val, 10);
};

const workDuration = isNaNOrDefault(localStorage.workDuration, 25 * 60);
const shortBreakDuration = isNaNOrDefault(
  localStorage.shortBreakDuration,
  5 * 60,
);
const longBreakDuration = isNaNOrDefault(
  localStorage.longBreakDuration,
  15 * 60,
);

export const useStore = create(
  combine(
    {
      mode: 'work' as Mode,
      state: 'idle' as State,
      interval: null as NodeJS.Timer | null,

      workDuration,
      shortBreakDuration,
      longBreakDuration,

      finishedSessions: 0,
      timeLeft: workDuration,
    },
    (set, get) => ({
      stop: () => {
        const { interval } = get();

        if (interval !== null) clearInterval(interval);

        return set({ interval: null });
      },
      start: () => {
        if (get().interval !== null) return;

        const interval = setInterval(() => {
          const { timeLeft } = get();

          if (timeLeft <= 0) {
            clearInterval(interval);

            const { mode, finishedSessions } = get();
            const data: Partial<ReturnType<typeof get>> = {
              state: 'idle',
              interval: null,
              mode: 'work',
            };

            if (mode === 'work') {
              const total = finishedSessions + 1;

              if (mode === 'work' && total % 4 === 0) {
                data.mode = 'longBreak';
              } else if (mode === 'work') {
                data.mode = 'shortBreak';
              }

              data.finishedSessions = total;
            }

            data.timeLeft = get()[`${data.mode as Mode}Duration`];

            return set(data);
          }

          set({ timeLeft: timeLeft - 1 });
        }, 1_000);

        set({ interval });
      },
      reset: () => {
        const { mode } = get();

        return set({ timeLeft: get()[`${mode}Duration`] });
      },
      setMode: (mode: Mode) => {
        const { state, interval } = get();

        if (state === 'running' && interval !== null) {
          clearInterval(interval);
        }

        return set({
          mode,
          timeLeft: get()[`${mode}Duration`],
          interval: null,
        });
      },
      incrementFinishedSessions: () => {
        const { finishedSessions } = get();
        const next = finishedSessions + 1;

        set({ finishedSessions: next });

        return next;
      },
    }),
  ),
);

export type Store = ReturnType<(typeof useStore)['getState']>;
