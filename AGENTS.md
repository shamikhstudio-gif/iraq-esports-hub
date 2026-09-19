# Iraq Esports Hub (IEH) Architecture Rules

- **Framework**: Pure Vite + React SPA with React Router.
- **Styling**: Strictly 100% Monochrome Black & White (`#000000` & `#ffffff`). No fruit-salad chromatic colors.
- **Backend API**: Integrated Hono middleware in `src/server/api.ts` mounted at `/api/*`.
- **Database & Auth**: Supabase client SDK (`@/lib/supabase`).
- **Mobile Live Execution**:
  - When asked to run or launch on the phone, NEVER perform full APK rebuilds, Gradle compiles, or multi-step screencaps/taps.
  - The live-reload APK is already installed on device. Simply ensure dev server is up, run `adb reverse tcp:3000 tcp:3000`, and launch `adb shell monkey -p com.eshamikh.ieh -c android.intent.category.LAUNCHER 1` (or `npm run phone`). This must take <= 2 seconds.
- **Desktop Execution (Electron)**:
  - Run `npm run desktop` (or `npm run electron:dev`).
  - Native shell code resides in `electron/main.cjs` and `electron/preload.cjs`.
  - Frontend shares 100% of the `src/` codebase with Web and Mobile, featuring the custom frameless `<DesktopTitleBar />` and system tray minimization.
- **Execution Speed & No Over-Verification**:
  - NEVER write or run ad-hoc Playwright test scripts, launch Chromium browser processes, or perform screenshot captures for routine code, unless EXPLICITLY instructed by the user.
  - Make edits immediately and report completion without verification marathons.
