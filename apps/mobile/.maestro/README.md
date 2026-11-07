# E2E flows (Maestro)

PRD §10 names four flows to cover: onboarding, log a workout, log a meal, offline → online sync.
These are written against the app's actual visible text/labels as of Phase 6, but **have not been
run** — Maestro isn't installed in the environment these were authored in (no Android
emulator/iOS simulator available), so treat these as a verified-by-careful-reading starting point,
not a passing test suite. Expect to fix selector drift the first time they're actually run.

## Running them (once you have Maestro + an emulator/device)

```
# Install: https://maestro.mobile.dev
curl -Ls "https://get.maestro.mobile.dev" | bash

# With the app already built/running on a connected emulator or device:
maestro test apps/mobile/.maestro/onboarding.yaml
maestro test apps/mobile/.maestro/log-workout.yaml
maestro test apps/mobile/.maestro/log-meal.yaml
maestro test apps/mobile/.maestro/offline-online-sync.yaml
```

## Prerequisites these flows assume

- `log-workout.yaml` and `log-meal.yaml` assume a logged-in account that has already completed
  onboarding and has at least one workout template (the three seeded starters — Push/Pull/Legs —
  satisfy this) and the food catalog seeded (automatic on first app launch).
- `offline-online-sync.yaml` needs a device/emulator where Maestro's airplane-mode toggle actually
  works (reliable on Android emulators; iOS simulator airplane-mode toggling is less consistent —
  PRD §10 lists this as an Android-emulator + iOS-simulator flow, so this may need platform-specific
  handling Maestro itself documents).
- An invite code must exist server-side before `onboarding.yaml` can sign up — these flows don't
  create one; provide `INVITE_CODE` via `maestro test -e INVITE_CODE=... onboarding.yaml` or edit
  the flow directly.
