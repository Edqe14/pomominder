import { PictureInPicture } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/shallow';
import { formatTime } from '../lib/helper/formatTime';
import { useStore } from '../lib/store';

const Colors = {
  work: '#923737',
  shortBreak: '#2d6a6e',
  longBreak: '#2e5a79',
} as const;

// The PiP document starts empty and shares no stylesheet with the page, so
// these few elements are styled inline instead of cloning document.styleSheets.
const PipTimer = () => {
  const [mode, timeLeft, state, start, stop] = useStore(
    useShallow((s) => [s.mode, s.timeLeft, s.state, s.start, s.stop]),
  );

  return (
    <div
      onClick={() => (state === 'idle' ? start() : stop())}
      style={{
        background: Colors[mode],
        color: '#e4e4e7',
        font: '600 4rem Inter, sans-serif',
        display: 'grid',
        placeItems: 'center',
        height: '100vh',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {formatTime(timeLeft)}
    </div>
  );
};

export const Pip = () => {
  const [supported, setSupported] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Deferred to an effect so the server-rendered markup matches the first
  // client render; the button appears right after hydration.
  useEffect(() => setSupported('documentPictureInPicture' in window), []);

  const toggle = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    try {
      const w = await window.documentPictureInPicture!.requestWindow({
        width: 320,
        height: 180,
      });

      w.document.body.style.margin = '0';
      w.addEventListener('pagehide', () => setPipWindow(null));

      setPipWindow(w);
    } catch {
      // Denied, or a window is already open. Nothing to recover.
    }
  };

  if (!supported) return null;

  return (
    <>
      <PictureInPicture
        className="opacity-50 hover:opacity-75 transition-opacity duration-200 ease-in-out"
        onClick={toggle}
        weight="thin"
        size={52}
      />

      {pipWindow && createPortal(<PipTimer />, pipWindow.document.body)}
    </>
  );
};
