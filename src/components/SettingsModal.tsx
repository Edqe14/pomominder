import { Clock, SpeakerHigh, X } from '@phosphor-icons/react';
import type { ChangeEvent } from 'react';
import { useShallow } from 'zustand/shallow';
import { useStore, type Mode } from '../lib/store';

const handleTimeChange =
  (mode: Mode) => (e: ChangeEvent<HTMLInputElement>) => {
    const minutes = Number(e.target.value);

    if (!Number.isFinite(minutes) || minutes < 1) return;

    useStore.getState().setDuration(mode, minutes * 60);
  };

const DurationField = ({
  label,
  mode,
  value,
}: {
  label: string;
  mode: Mode;
  value: number;
}) => (
  <div className="form-control w-full min-w-[24rem] max-w-md">
    <label className="label">
      <span className="label-text">{label}</span>
      <span className="text-xs opacity-60">In minutes</span>
    </label>

    <input
      className="input input-bordered w-full"
      type="number"
      value={value / 60}
      min={1}
      onChange={handleTimeChange(mode)}
    />
  </div>
);

export const SettingsModal = () => {
  const [
    open,
    toggleSettings,
    updateSettings,
    workDuration,
    shortBreakDuration,
    longBreakDuration,
    autoStartSession,
    longBreakInterval,
    alarmVolume,
  ] = useStore(
    useShallow((s) => [
      s.settingsOpen,
      s.toggleSettings,
      s.updateSettings,
      s.workDuration,
      s.shortBreakDuration,
      s.longBreakDuration,
      s.autoStartSession,
      s.longBreakInterval,
      s.alarmVolume,
    ]),
  );

  return (
    <section
      className={`absolute inset-0 grid place-items-center w-screen h-screen transition-opacity duration-200 ease-in-out ${
        !open ? 'pointer-events-none opacity-0' : 'bg-zinc-800/30'
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

        <section className="flex flex-col gap-2 mb-4">
          <div className="flex w-full items-center justify-center gap-2">
            <DurationField
              label="Work duration"
              mode="work"
              value={workDuration}
            />
          </div>

          <div className="flex w-full items-center justify-center gap-2">
            <DurationField
              label="Short break duration"
              mode="shortBreak"
              value={shortBreakDuration}
            />
          </div>

          <div className="flex w-full items-center justify-center gap-2">
            <DurationField
              label="Long break duration"
              mode="longBreak"
              value={longBreakDuration}
            />
          </div>

          <div className="flex w-full items-center justify-center gap-2">
            <div className="flex items-center justify-between gap-4 w-full max-w-md">
              <label className="label inline-flex">
                <span className="label-text">Auto start sessions</span>
              </label>

              <input
                className="toggle toggle-info"
                type="checkbox"
                checked={autoStartSession}
                onChange={(e) =>
                  updateSettings({ autoStartSession: e.target.checked })
                }
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-2">
            <div className="flex items-center justify-between gap-4 w-full max-w-md">
              <label className="label inline-flex">
                <span className="label-text">Long break interval</span>
              </label>

              <input
                className="input input-bordered"
                type="number"
                min={1}
                value={longBreakInterval}
                onChange={(e) => {
                  const value = Number(e.target.value);

                  if (!Number.isInteger(value) || value < 1) return;

                  updateSettings({ longBreakInterval: value });
                }}
              />
            </div>
          </div>
        </section>

        <section className="flex justify-between items-center">
          <h2 className="flex items-center gap-3 font-bold text-lg mb-1">
            <SpeakerHigh size={24} weight="bold" /> Sound
          </h2>
        </section>

        <section className="flex flex-col gap-2 mb-4">
          <div className="flex w-full items-center justify-center gap-2">
            <div className="flex items-center justify-between gap-4 w-full max-w-md">
              <label className="label inline-flex shrink-0">
                <span className="label-text">Alarm Volume</span>
              </label>

              <input
                className="range range-info range-xs"
                type="range"
                min={0}
                max={100}
                value={alarmVolume * 100}
                onChange={(e) =>
                  updateSettings({ alarmVolume: Number(e.target.value) / 100 })
                }
              />
            </div>
          </div>
        </section>

        <button
          type="button"
          className="btn btn-success w-full mt-6"
          onClick={toggleSettings}
        >
          Ok
        </button>
      </section>

      <span className="absolute inset-0 block" onClick={toggleSettings} />
    </section>
  );
};
