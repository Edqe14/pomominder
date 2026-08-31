import { create } from 'zustand';
import { combine, persist } from 'zustand/middleware';

export type Mode = 'work' | 'shortBreak' | 'longBreak';
export type State = 'idle' | 'running';

export type Settings = {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  alarmVolume: number;
  autoStartSession: boolean;
};

const DEFAULTS: Settings = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  alarmVolume: 1,
  autoStartSession: false,
};

// Reused across sessions so the alarm is preloaded when it has to fire.
let alarm: HTMLAudioElement | undefined;

const playAlarm = (volume: number) => {
  if (typeof Audio === 'undefined') return;

  alarm ??= new Audio('/audio/alarm.mp3');

  // HTMLMediaElement.volume throws IndexSizeError outside 0..1.
  alarm.volume = Math.min(1, Math.max(0, volume));
  alarm.currentTime = 0;

  // Blocked autoplay rejects; a missed alarm should not break the timer.
  alarm.play().catch(() => {});
};

const TICK_MS = 250;

export const useStore = create(
  persist(
    combine(
      {
        ...DEFAULTS,

        mode: 'work' as Mode,
        state: 'idle' as State,
        interval: null as ReturnType<typeof setInterval> | null,
        // Epoch ms the current run ends at. Time comes from the clock, not
        // from counting ticks, so throttled tabs and sleep cannot drift.
        endsAt: null as number | null,
        settingsOpen: false,
        finishedSessions: 0,
        timeLeft: DEFAULTS.workDuration,
      },
      (set, get) => {
        const clear = () => {
          const { interval } = get();
          if (interval !== null) clearInterval(interval);
        };

        const complete = () => {
          const {
            mode,
            finishedSessions,
            longBreakInterval,
            alarmVolume,
            autoStartSession,
          } = get();

          playAlarm(alarmVolume);

          let nextMode: Mode = 'work';
          let total = finishedSessions;

          if (mode === 'work') {
            total += 1;
            nextMode =
              total % longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
          }

          const duration = get()[`${nextMode}Duration`];

          if (!autoStartSession) {
            clear();

            return set({
              mode: nextMode,
              finishedSessions: total,
              timeLeft: duration,
              interval: null,
              endsAt: null,
              state: 'idle',
            });
          }

          return set({
            mode: nextMode,
            finishedSessions: total,
            timeLeft: duration,
            endsAt: Date.now() + duration * 1000,
          });
        };

        const tick = () => {
          const { endsAt } = get();
          if (endsAt === null) return;

          const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

          // Also the wake-from-sleep path: left is already 0, so the session
          // completes on the next tick instead of freezing.
          if (left <= 0) {
            complete();
            return;
          }

          if (left !== get().timeLeft) set({ timeLeft: left });
        };

        const stop = () => {
          clear();

          return set({ interval: null, endsAt: null, state: 'idle' });
        };

        return {
          tick,
          stop,
          toggleSettings: () => {
            const next = !get().settingsOpen;

            set({ settingsOpen: next });

            return next;
          },
          start: () => {
            if (get().interval !== null) return;

            set({
              state: 'running',
              endsAt: Date.now() + get().timeLeft * 1000,
              interval: setInterval(tick, TICK_MS),
            });
          },
          reset: () => {
            const { mode, state } = get();
            const duration = get()[`${mode}Duration`];

            return set({
              timeLeft: duration,
              endsAt: state === 'running' ? Date.now() + duration * 1000 : null,
            });
          },
          setMode: (mode: Mode) => {
            clear();

            return set({
              mode,
              timeLeft: get()[`${mode}Duration`],
              interval: null,
              endsAt: null,
              state: 'idle',
            });
          },
          setDuration: (mode: Mode, seconds: number) => {
            const active = get().mode === mode;

            return set({
              [`${mode}Duration`]: seconds,
              ...(active
                ? {
                    timeLeft: seconds,
                    endsAt:
                      get().state === 'running'
                        ? Date.now() + seconds * 1000
                        : null,
                  }
                : {}),
            });
          },
          updateSettings: (patch: Partial<Settings>) => set(patch),
        };
      },
    ),
    {
      name: 'pomominder',
      partialize: (s) =>
        Object.fromEntries(
          Object.keys(DEFAULTS).map((k) => [k, s[k as keyof Settings]]),
        ) as Settings,
      // Persisted durations must reach timeLeft, which is not itself persisted.
      onRehydrateStorage: () => (s) => s?.reset(),
    },
  ),
);

export type Store = ReturnType<(typeof useStore)['getState']>;
