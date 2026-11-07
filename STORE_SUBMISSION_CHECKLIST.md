# Store submission checklist

Honest status as of Phase 6. I (Claude) can't actually submit this app to the App Store or Play
Store — that needs developer accounts, signing certificates/provisioning, and a human review step
I have no access to. This is a checklist of what's genuinely ready vs. what you still need to do.

## Already done

- [x] App icon + adaptive icon (foreground/background/monochrome) + splash screen — `apps/mobile/assets/`
- [x] In-app account deletion (Settings → Delete account) — Apple/Google requirement, PRD §3.1/§7.9
- [x] Privacy policy reachable in-app (consent screen + Settings) — **draft content, see below**
- [x] Consent screen at sign-up
- [x] Offline-first core logging (works without a network connection after initial sync)
- [x] No third-party social login (so Sign in with Apple isn't required per PRD §7.9)

## You still need to do

### Before any submission
- [ ] **Have the privacy policy (`app/privacy-policy.tsx`) reviewed by a lawyer** — it's accurate
      about what the app currently does, but I'm not qualified to certify it meets Apple/Google's
      actual policy requirements or India's DPDP Act. Also host it at a public URL (both stores
      require a reachable privacy policy link in the listing, not just in-app).
- [ ] Replace the placeholder contact email in the privacy policy with a real one.
- [ ] Decide on and document a support contact / support URL (both stores require one).
- [ ] Pick and configure a real hosting provider (see `HOSTING.md` — still an open decision) and
      point `apps/mobile/app.json`'s `apiBaseUrl` at it for production builds.
- [ ] Set up EAS Build production profiles and actually sign the app (Android keystore, iOS
      distribution certificate + provisioning profile) — none of this exists yet.

### Store listing content (neither store accepts a blank listing)
- [ ] App name, short + full description, keywords
- [ ] Screenshots for each required device size (phone, and tablet if `ios.supportsTablet` stays
      true) — nothing has ever been run on a real device/emulator in this project, so none exist yet
- [ ] Feature graphic (Play Store) / App Store preview assets
- [ ] Category, content/age rating questionnaire
- [ ] **Data safety form (Play Store) / App Privacy details (App Store)** — this is where you
      declare what data the app collects and why; answer it directly from the privacy policy
      content so the two stay consistent, don't fill it out separately from memory

### Technical gates worth closing first
- [ ] Run the Maestro E2E flows (`apps/mobile/.maestro/`) on a real emulator/device at least once —
      they were written without ever being run (no Maestro installed in this environment) and will
      likely need selector fixes the first time
- [ ] Get the backend actually deployed somewhere real and run a full end-to-end sign-up → log data
      → sync → second-device pull test against it — everything so far has been verified by
      `dotnet build`/`dotnet test` and reasoning, never against a live deployment
- [ ] Decide app review sign-off on the known cross-device ID-reconciliation gap (flagged during
      Phase 2 audit) — low risk for a single/invite-only user base, worth a conscious decision
      before opening up to more users
- [ ] Sentry (or equivalent crash reporting) — PRD §7.9 commits to this, not wired up yet
- [ ] App lock protecting progress photos — PRD mentions this as the privacy protection for photos,
      not built (flagged explicitly during Phase 5)

### Not blocking a first submission, but worth knowing
- Invite-only sign-up (PRD's deliberate v1 scope) means this isn't really "launchable" to the
  public yet anyway — that's a product decision, not a technical gap.
