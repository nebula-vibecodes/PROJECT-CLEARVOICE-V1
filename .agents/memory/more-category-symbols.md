---
name: More category symbols
description: The accessibility and semantic rule for Mulberry symbols on Clearvoice topic navigation controls.
---

More-category navigation controls may use broad official Mulberry symbols to make the topic visually recognizable, but the control's accessible name must continue to come from the category label and navigation action, never from the asset filename or symbol ID.

**Why:** These controls open vocabulary topics rather than speak the symbol concept. The visual asset supports scanning, while assistive technology needs the stable category name and existing open-topic action.

**How to apply:** Keep category IDs, labels, ordering, focus behavior, keyboard navigation, and `Open <category> vocabulary` labels unchanged when changing category artwork. Cache and attribute every newly bundled asset locally.