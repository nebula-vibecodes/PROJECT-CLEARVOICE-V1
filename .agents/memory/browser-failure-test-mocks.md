---
name: Browser failure-test mocks
description: Durable testing constraints for Clearvoice browser API failure coverage.
---

Clearvoice browser API failure tests must control the exact jsdom object used by the app inside each test. Vitest `restoreMocks` can restore setup-time mocks between tests, and replacing a navigator property may not be enough when the app reads a nested browser object.

**Why:** Clipboard and speech failure tests otherwise reported success from jsdom's native implementation, or failed while trying to configure a mock that had already been restored.

**How to apply:** Install a fresh clipboard object when testing native-share fallback, patch the existing clipboard method for rejection or absence, configure speech callbacks per test, and restore any navigator or nested-object descriptors in `finally` blocks.