# waki-chat

Waki is an Android talking-alarm application combining the Waki, WakeupChat and AlarmChat ideas.

## Current state

Use frontend/WakiAlarm, not the historical root React Native package or frontend package. Native alarm code and a debug APK exist; real-phone acceptance remains outstanding. Vapi conversation is unfinished. Do not equate provider configuration with a tested wake-up flow.

See [LOG.md](LOG.md) for dated verification and outstanding work.

## Getting started

Use [DEVELOPMENT.md](DEVELOPMENT.md) for commands and configuration.

## Next milestone

Connect the user's Android phone, configure the intended Firebase project, then verify scheduling, locked-screen ringing, snooze, stop and microphone interaction.

<!-- repository-guide:start -->
## Repository guide

- [Agent instructions](AGENTS.md)
- [Founder mission](FOUNDER.md)
- [Current status and session history](LOG.md)
- [Architecture](ARCHITECTURE.md)
- [Roadmap](ROADMAP.md)
- [Setup and verification](DEVELOPMENT.md)
<!-- repository-guide:end -->

The previous README is preserved in [docs/README-LEGACY.md](docs/README-LEGACY.md) for historical reference; its feature and setup claims may be outdated.
