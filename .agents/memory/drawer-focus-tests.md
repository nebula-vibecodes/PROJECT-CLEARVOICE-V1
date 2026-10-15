---
name: Drawer focus tests
description: Environment-specific guidance for testing keyboard focus containment and restoration in jsdom.
---

Use a test-only `getClientRects` shim because jsdom reports zero layout rectangles for rendered controls, while the production focusable-element filter correctly excludes zero-geometry elements. Set focus on the opener before dispatching the open click so autofocus inside the drawer cannot replace the opener before capture.

**Why:** Without those browser-behavior shims, the test falsely sends focus to `body` and makes drawer restoration look broken even though the browser has real layout geometry and button click focus.

**How to apply:** Keep the shim isolated to the test setup; do not weaken the production focusability filter or remove autofocus from the UI just to satisfy jsdom.