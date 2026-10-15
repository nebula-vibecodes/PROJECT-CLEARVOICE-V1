---
name: Starter symbol delivery
description: Offline delivery and fallback rules for Clearvoice’s bundled local pictograms.
---

Bundled pictograms may use the Clearvoice SVG sprite or approved standalone local SVG files. Render only assets whose location-and-ID pair is in the known bundled metadata; unknown or missing local assets stay text-only.

**Why:** An imported local path can be syntactically safe while still pointing to an absent asset; rendering it would create a broken symbol instead of a useful AAC card.

**How to apply:** Keep every mapped sprite or standalone SVG in the service-worker shell cache. Update vocabulary metadata, attribution inventory, bundled-pair validation, and offline coverage together; retain the fallback rather than force a misleading match.

The vocabulary display default is Symbol and text. A one-time local migration upgrades the former automatically persisted Text only default, while a separate explicit-choice marker preserves deliberate Text only selections across reloads.

**Why:** The previous default was persisted before users had intentionally chosen a display mode, so changing only the in-memory default left existing demos text-only.

**How to apply:** Keep migration state separate from exported communication preferences; changing a display radio or resetting settings records an explicit choice.