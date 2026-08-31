import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { formatTime } from './helper/formatTime.ts';
import { useStore } from './store.ts';

const MINUTE = 60 * 1000;

// Mock timers must be enabled per test, and the running interval must be
// cleared before the mock is torn down or the next test's clock never fires.
const setup = (t: TestContext) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  t.after(() => useStore.getState().stop());

  useStore.getState().stop();
  useStore.setState({
    mode: 'work',
    finishedSessions: 0,
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    longBreakInterval: 4,
    autoStartSession: false,
    alarmVolume: 1,
    timeLeft: 25 * 60,
  });
};

test('timeLeft tracks the wall clock, not the number of ticks', (t) => {
  setup(t);
  useStore.getState().start();

  assert.equal(useStore.getState().timeLeft, 25 * 60);

  t.mock.timers.tick(MINUTE);
  assert.equal(useStore.getState().timeLeft, 24 * 60);

  // A throttled or slept tab delivers one late tick covering ten minutes.
  // Counting ticks would lose that gap; deriving from endsAt does not.
  t.mock.timers.tick(10 * MINUTE);
  assert.equal(useStore.getState().timeLeft, 14 * 60);
});

test('a session that elapsed while asleep completes on the next tick', (t) => {
  setup(t);
  useStore.getState().start();

  t.mock.timers.tick(40 * MINUTE); // deadline was only 25 minutes out

  const s = useStore.getState();
  assert.equal(s.finishedSessions, 1);
  assert.equal(s.mode, 'shortBreak');
  assert.equal(s.timeLeft, 5 * 60);
  assert.equal(s.state, 'idle', 'stays paused because autoStartSession is off');
  assert.equal(s.interval, null);
});

test('every fourth work session leads into the long break', (t) => {
  setup(t);
  useStore.setState({ autoStartSession: true });
  useStore.getState().start();

  const modes: string[] = [];

  for (let i = 0; i < 4; i += 1) {
    t.mock.timers.tick(25 * MINUTE); // finish the work session
    modes.push(useStore.getState().mode);
    t.mock.timers.tick(useStore.getState().timeLeft * 1000); // finish the break
  }

  assert.deepEqual(modes, [
    'shortBreak',
    'shortBreak',
    'shortBreak',
    'longBreak',
  ]);
  assert.equal(useStore.getState().finishedSessions, 4);
});

test('pause keeps the remaining time and resume picks it back up', (t) => {
  setup(t);
  useStore.getState().start();

  t.mock.timers.tick(5 * MINUTE);
  useStore.getState().stop();
  assert.equal(useStore.getState().timeLeft, 20 * 60);
  assert.equal(useStore.getState().state, 'idle');

  // Time passing while paused must not eat into the session.
  t.mock.timers.tick(30 * MINUTE);
  assert.equal(useStore.getState().timeLeft, 20 * 60);

  useStore.getState().start();
  t.mock.timers.tick(MINUTE);
  assert.equal(useStore.getState().timeLeft, 19 * 60);
});

test('switching mode while running stops the timer instead of leaving it half-alive', (t) => {
  setup(t);
  useStore.getState().start();

  t.mock.timers.tick(MINUTE);
  useStore.getState().setMode('longBreak');

  const s = useStore.getState();
  assert.equal(s.state, 'idle');
  assert.equal(s.interval, null);
  assert.equal(s.timeLeft, 15 * 60);

  t.mock.timers.tick(5 * MINUTE);
  assert.equal(useStore.getState().timeLeft, 15 * 60, 'no orphaned interval');
});

test('changing the active duration retargets the running deadline', (t) => {
  setup(t);
  useStore.getState().start();

  t.mock.timers.tick(MINUTE);
  useStore.getState().setDuration('work', 10 * 60);

  assert.equal(useStore.getState().timeLeft, 10 * 60);

  t.mock.timers.tick(MINUTE);
  assert.equal(useStore.getState().timeLeft, 9 * 60);
});

test('formatTime pads and never renders a negative clock', () => {
  assert.equal(formatTime(1500), '25:00');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(-5), '00:00');
});
