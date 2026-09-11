# Development

## Scope and prerequisites

Use frontend/WakiAlarm, not the historical root React Native package or frontend package. Native alarm code and a debug APK exist; real-phone acceptance remains outstanding. Vapi conversation is unfinished. Do not equate provider configuration with a tested wake-up flow.

Commands below run from the repository root unless a `cd` is shown. Install the runtime required by the package manifest. For Node projects, preserve package-lock.json with `npm ci`; Quiet Orbit uses its pnpm lockfile; the voice service uses uv.lock. Installation may require network access.

## Commands

```text
npm ci --prefix backend
npm ci --prefix frontend/WakiAlarm
npm ci --prefix website
# Run these in separate terminals as needed
npm run dev --prefix backend
npm start --prefix frontend/WakiAlarm
# Verification
npm test --prefix backend
npm test --prefix frontend/WakiAlarm -- --runInBand
npm run build --prefix website
```

These commands come from the current manifests; they are not a claim that all checks passed during documentation setup. Check LOG.md for dated results. Builds may require configuration, downloads or external services.

## Configuration

Configuration shape: `backend/.env.example`. See the comments about which process loads these variables.

Use dummy examples for configuration shape only; supply real credentials outside version control. Client-prefixed variables are public. Export environment variables explicitly when the app has no dotenv loader.

## Source map

frontend/WakiAlarm: canonical React Native Android app; backend: Express/TypeScript API; website: Vite introduction; CONSOLIDATION.md: imported features and preserved sources; ANDROID-TESTING.md: device checklist.

## Next verification

Connect the user's Android phone, configure the intended Firebase project, then verify scheduling, locked-screen ringing, snooze, stop and microphone interaction.

## Repository check

`python scripts/check_repository.py` checks the documentation contract and tracked local-secret filenames. GitHub Actions runs this baseline check; it does not certify runtime or deployment readiness.
