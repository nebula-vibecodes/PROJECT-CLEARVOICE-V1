---
name: Local data boundary
description: Durable Clearvoice constraints for personal vocabulary, accessibility settings, and message privacy.
---

Clearvoice stores only accessibility preferences and personal vocabulary locally. Composed messages and message history must remain transient React state and must never be serialized, transmitted, or added to cloud-backed storage.

Default vocabulary records are the stable baseline. Personal entries are a separate source with separate positions, so adding or reordering personal items cannot move default motor-memory locations. Restoring defaults removes personal vocabulary only and leaves accessibility preferences and the current message unchanged.

Local JSON transfer must contain only versioned accessibility preferences and validated personal vocabulary. Reject oversized, malformed, executable-looking, duplicate, or structurally invalid data before it reaches application state.

**Why:** The demo is intended to support autonomy and local experimentation without accounts, tracking, remote monitoring, cloud sync, or accidental message-history retention.

**How to apply:** For future vocabulary or settings features, preserve the local-only boundary, validate at import and storage-read boundaries, and keep browser speech explicitly dependent on device support.

Personal-item positions are normalized independently within each personal category during validation; imported positions may be sparse or collide, but their stable input order breaks ties, and default records are never part of that normalization.

**Why:** Current-version exports used shared section positions, so normalization must preserve their relative order without changing default motor-memory locations.

**How to apply:** Use personal category/topic as the ordering key for creation, editing, reordering, storage reads, and imports; reject positions outside the bounded integer range before normalization.