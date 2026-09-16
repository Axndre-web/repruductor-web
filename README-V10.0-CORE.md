# NEON PLAYER X V10.0 — CORE EVOLUTION

Cumulative release based on V9.1. Previous systems are retained.

## Repairs / improvements
- Unified NEON Core event bus over existing Orb systems.
- Normalized heterogeneous memory records for AI context.
- Persisted Orb homeAttachment into life state.
- Added preference/event correlation without replacing autonomous decisions.
- Added observable media signal bridge.
- Reworked service worker to precache the application shell and provide cache-first responsive loading with network refresh plus navigation fallback.
- Preserved external radio/AI as network-dependent services; local Orb remains functional without them.

## Important
The service worker follows an offline shell strategy appropriate for static PWA assets; external radio streams and remote AI remain dependent on their own network endpoints.
