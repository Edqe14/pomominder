import { shallow } from 'zustand/shallow';
import { Clock, X } from '@phosphor-icons/react';
import { Button, Input, Toggle } from 'react-daisyui';
import type { ChangeEvent } from 'react';
import { Mode, Store, useStore } from '../lib/store';

const handleTimeChange = (mode: Mode) => {
  return (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) * 60; // seconds

    if (value < 1) return;

    const name = `${mode}Duration`;
    const data: Partial<Store> = {
      [name]: value,
    };

    if (useStore.getState().mode === mode) {
      data.timeLeft = value;
    }

    localStorage.setItem(name, value.toString());
    useStore.setState(data);
  };
};

const handleChecked = (key: 'autoStartSession') => {
  return (e: ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem(key, e.target.checked.toString());
    useStore.setState({ [key]: e.target.checked });
  };
};

const handleConfigChange = <
  K extends keyof Omit<Store, 'autoStartSession' | `${Mode}Duration`>,
>(
  key: K,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-shadow
  test?: (value: string, key: K) => boolean,
) => {
  return (e: ChangeEvent<HTMLInputElement>) => {
    if (test && !test(e.target.value, key)) return;

    localStorage.setItem(key, e.target.value);
    useStore.setState({ [key]: e.target.value });
  };
};

export const SettingsModal = () => {
  const [
    open,
    toggleSettings,
    workDuration,
    shortBreakDuration,
    longBreakDuration,
    autoStartSession,
    longBreakInterval,
  ] = useStore(
    (s) => [
      s.settingsOpen,
      s.toggleSettings,
      s.workDuration,
      s.shortBreakDuration,
      s.longBreakDuration,
      s.autoStartSession,
      s.longBreakInterval,
    ],
    shallow,
  );

  return (
    <section
      className={`absolute inset-0 grid place-items-center w-screen h-screen transition-opacity duration-200 ease-in-out ${
        !open ? 'pointer-events-none opacity-0' : 'bg-zinc-800 bg-opacity-30'
      }`}
    >
      <section className="z-10 bg-zinc-200 text-zinc-700 p-6 rounded-xl">
        <section className="flex justify-between items-center">
          <h2 className="flex items-center gap-3 font-bold text-lg mb-1">
            <Clock size={24} weight="bold" /> Timer
          </h2>

          <X
            className="cursor-pointer"
            onClick={toggleSettings}
            weight="bold"
          />
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex w-full component-preview items-center justify-center gap-2">
            <div className="form-control w-full min-w-[24rem] max-w-md">
              <label className="label">
                <span className="label-text">Work duration</span>
                <span className="text-xs opacity-60">In minutes</span>
              </label>

              <Input
                type="number"
                value={workDuration / 60}
                min={1}
                onChange={handleTimeChange('work')}
              />
            </div>
          </div>

          <div className="flex w-full component-preview items-center justify-center gap-2">
            <div className="form-control w-full max-w-md">
              <label className="label">
                <span className="label-text">Short break duration</span>
                <span className="text-xs opacity-60">In minutes</span>
              </label>

              <Input
                type="number"
                value={shortBreakDuration / 60}
                min={1}
                onChange={handleTimeChange('shortBreak')}
              />
            </div>
          </div>

          <div className="flex w-full component-preview items-center justify-center gap-2">
            <div className="form-control w-full max-w-md">
              <label className="label">
                <span className="label-text">Long break duration</span>
                <span className="text-xs opacity-60">In minutes</span>
              </label>

              <Input
                type="number"
                value={longBreakDuration / 60}
                min={1}
                onChange={handleTimeChange('longBreak')}
              />
            </div>
          </div>

          <div className="flex w-full component-preview items-center justify-center gap-2">
            <div className="flex items-center justify-between gap-4 w-full max-w-md">
              <label className="label inline-flex">
                <span className="label-text">Auto start sessions</span>
              </label>

              <Toggle
                color="info"
                checked={autoStartSession}
                onChange={handleChecked('autoStartSession')}
              />
            </div>
          </div>

          <div className="flex w-full component-preview items-center justify-center gap-2">
            <div className="flex items-center justify-between gap-4 w-full max-w-md">
              <label className="label inline-flex">
                <span className="label-text">Long break interval</span>
              </label>

              <Input
                type="number"
                min={1}
                value={longBreakInterval}
                onChange={handleConfigChange(
                  'longBreakInterval',
                  (v) => Number(v) >= 1,
                )}
              />
            </div>
          </div>
        </section>

        <Button
          color="success"
          className="mt-6"
          fullWidth
          onClick={toggleSettings}
        >
          Ok
        </Button>
      </section>

      <span className="absolute inset-0 block" onClick={toggleSettings} />
    </section>
  );
};
