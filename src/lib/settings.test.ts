import assert from 'node:assert/strict';
import test from 'node:test';
import { hydrateSettings, loadSettings, useStore } from './store.ts';

const stub = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  const storage = {
    writes: 0,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.writes += 1;
      data.set(key, value);
    },
    removeItem: (key: string) => data.delete(key),
    has: (key: string) => data.has(key),
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  });

  return storage;
};

test('imports the pre-0.1 flat keys once, then drops them', () => {
  const storage = stub({
    workDuration: '1800',
    alarmVolume: '0.5',
    autoStartSession: 'true',
  });

  assert.deepEqual(loadSettings(), {
    workDuration: 1800,
    alarmVolume: 0.5,
    autoStartSession: true,
  });

  assert.equal(storage.has('workDuration'), false);
  // Second load finds neither the new key nor the legacy ones.
  assert.deepEqual(loadSettings(), {});
});

test('rejects out-of-range and unparseable stored values', () => {
  stub({
    pomominder: JSON.stringify({
      workDuration: 0,
      shortBreakDuration: 'nope',
      longBreakDuration: 600,
      alarmVolume: 4,
      longBreakInterval: NaN,
    }),
  });

  assert.deepEqual(loadSettings(), { longBreakDuration: 600 });
});

// Must come last: hydrateSettings only ever runs once per process.
test('does not write to storage while the timer ticks', () => {
  const storage = stub({ pomominder: JSON.stringify({ workDuration: 1800 }) });

  hydrateSettings();
  assert.equal(useStore.getState().workDuration, 1800);
  // Durations that are not persisted still have to reach timeLeft.
  assert.equal(useStore.getState().timeLeft, 1800);

  const before = storage.writes;
  useStore.setState({ timeLeft: 1799 });
  useStore.setState({ timeLeft: 1798 });
  assert.equal(storage.writes, before);

  useStore.getState().updateSettings({ longBreakInterval: 6 });
  assert.equal(storage.writes, before + 1);
});
