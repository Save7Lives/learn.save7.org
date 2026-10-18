---
status: proposed
---

# SQL owns the Progress Record read; no caller re-derives completion

A Stage is complete when its Stage Quiz is first passed, and a Level when every Stage Quiz in it is. That rule is already one predicate in SQL, and the Student dashboard, the Admin and the volunteer portal each re-derived it from raw rows, one of them (the portal) wrongly, from the retired read flag. We decided the Progress Record is read through one SQL module, with one record shape for a Student and for the Admin, and that the Next app and the Admin only present it. Improvement and the Growth Indicators stay computed at read time, in TypeScript, from that record.

## Considered Options

- **A TypeScript read module over the raw tables.** Rejected: it fixes the Next app but not the portal's runtime, and leaves the completion predicate defined twice.
- **Growth Indicators computed in SQL.** Rejected for now: the glossary scopes them to what the Progress Record already stores, and a second definition in SQL would repeat the duplication this removes. Revisit with an aggregate read if loading the whole pool becomes slow.

## Consequences

- The volunteer portal's Learn tab is retired rather than moved onto the module.
- The stored `COMPLETE` status for "read" stays; the module's interface says read and reserves complete for the quiz pass (see Read Mark in CONTEXT.md). Renaming the stored value is a separate, later decision.
- `isLevelContentComplete`, `gradeSelection` and `getLearnerSummary` are deleted: each is a second definition of a rule the module owns.
- Behaviour is tested through the module's interface with re-runnable scenarios, not only the one-shot migration probes.
