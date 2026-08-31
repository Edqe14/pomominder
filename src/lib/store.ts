import { create } from 'zustand';
import { combine } from 'zustand/middleware';

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

const STORAGE_KEY = 'pomominder';

const KEYS = Object.keys(DEFAULTS) as (keyof Settings)[];

// localStorage is user-editable, so every stored number is re-checked against
// its own range. Anything outside it falls back to the default.
const RANGES: Partial<Record<keyof Settings, [number, number]>> = {
  alarmVolume: [0, 1],
};

const coerce = (key: keyof Settings, value: unknown) => {
  if (value === undefined || value === null) return undefined;

  // Legacy values are raw strings, so booleans arrive as 'true' / '1'.
  if (typeof DEFAULTS[key] === 'boolean') {
    return value === true || value === 'true' || value === '1';
  }

  const num = Number(value);
  const [min, max] = RANGES[key] ?? [1, Infinity];

  return Number.isFinite(num) && num >= min && num <= max ? num : undefined;
};

const sanitize = (raw: unknown): Partial<Settings> => {
  if (typeof raw !== 'object' || raw === null) return {};

  const source = raw as Record<string, unknown>;

  return Object.fromEntries(
    KEYS.map((key) => [key, coerce(key, source[key])]).filter(
      ([, value]) => value !== undefined,
    ),
  ) as Partial<Settings>;
};

// Pre-0.1 builds kept each setting in its own localStorage key as a raw string.
const readLegacy = () =>
  Object.fromEntries(KEYS.map((key) => [key, localStorage.getItem(key)]));

export const loadSettings = (): Partial<Settings> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return sanitize(JSON.parse(stored));

    const legacy = sanitize(readLegacy());
    // One-time import. Dropping the old keys keeps this from running again.
    KEYS.forEach((key) => localStorage.removeItem(key));

    return legacy;
  } catch {
    // Disabled storage or corrupt JSON. Defaults are a fine fallback.
    return {};
  }
};

let saved: string | undefined;

// The store ticks 4x a second and none of that is persisted, so writes are
// skipped unless the settings themselves actually changed.
const saveSettings = (s: Settings) => {
  const next = JSON.stringify(
    Object.fromEntries(KEYS.map((key) => [key, s[key]])),
  );

  if (next === saved) return;
  saved = next;

  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Quota or private mode. Losing a setting beats throwing mid-render.
  }
};

// Reused across sessions so the alarm is preloaded when it has to fire.
let alarm: HTMLAudioElement | undefined;

// HTMLMediaElement.volume throws IndexSizeError outside 0..1.
const clamp = (volume: number) => Math.min(1, Math.max(0, volume));

const playAlarm = (volume: number) => {
  if (typeof Audio === 'undefined') return;

  alarm ??= new Audio('/audio/alarm.mp3');

  alarm.volume = clamp(volume);
  alarm.currentTime = 0;

  // Blocked autoplay rejects; a missed alarm should not break the timer.
  alarm.play().catch(() => {});
};

// Volume preview. Retunes the running alarm instead of restarting it, so
// dragging the slider stays one continuous sound.
export const previewAlarm = (volume: number) => {
  if (alarm && !alarm.paused) {
    alarm.volume = clamp(volume);
    return;
  }

  playAlarm(volume);
};

const TICK_MS = 250;

export const useStore = create(
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
);

export type Store = ReturnType<(typeof useStore)['getState']>;

let hydrated = false;

// Deferred to a client effect rather than run inside create(): the page is
// prerendered with the defaults, so reading storage any earlier would make the
// first React render disagree with the server markup.
export const hydrateSettings = () => {
  if (hydrated || typeof localStorage === 'undefined') return;
  hydrated = true;

  useStore.setState(loadSettings());
  // Stored durations must reach timeLeft, which is not itself persisted.
  useStore.getState().reset();

  saveSettings(useStore.getState());
  useStore.subscribe(saveSettings);
};
