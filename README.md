# Pomominder

[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node](https://img.shields.io/badge/node-%3E%3D22.19-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![Pomominder](public/pomo.jpg)

A Pomodoro timer that stays accurate in a background tab. Live at
[pomominder.edqe.me](https://pomominder.edqe.me/).

## Features

- Work / short break / long break modes with a configurable long-break interval
- Drift-free countdown — the timer is derived from a wall-clock deadline, not a tick counter, so throttled background tabs don't fall behind
- Alarm on session end, with volume preview while adjusting it
- Picture-in-Picture window (Chromium `documentPictureInPicture`) to keep the timer on top of other apps
- Optional auto-start of the next session
- Settings persisted to `localStorage`, validated on read

## Requirements

- Node.js >= 22.19.0
- pnpm 10 (`corepack enable`)

## Getting started

```sh
pnpm install
pnpm dev      # http://localhost:4321
```

## Commands

| Command        | Action                                   |
| :------------- | :--------------------------------------- |
| `pnpm dev`     | Start the dev server                     |
| `pnpm build`   | Build the production site to `./dist/`   |
| `pnpm preview` | Serve the production build locally       |
| `pnpm check`   | Type-check Astro, TypeScript and JSX     |
| `pnpm test`    | Run the timer and settings unit tests    |

## Project structure

```
public/audio/alarm.mp3     alarm sound
src/components/            React islands (Timer, ModeSelector, Pip, SettingsModal)
src/layouts/Layout.astro   page shell and meta tags
src/lib/store.ts           zustand store: timer state, settings, persistence
src/lib/*.test.ts          node:test unit tests
src/pages/index.astro      the only route
```

## Stack

Astro 7, React 19, Tailwind CSS 4 with daisyUI 5, zustand. Tests use the
built-in `node:test` runner with `--experimental-strip-types`, so there is no
test framework to install.

## License

MIT
