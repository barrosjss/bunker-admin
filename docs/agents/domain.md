# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo predates the mattpocock/skills default layout and already has its own convention. Use it as-is — do not create a root `CONTEXT.md` or a `docs/adr/` folder; the files below already fill those roles.

## Before exploring, read these

- **`docs/architecture.md`** — plays the role of `CONTEXT.md`: global system design, roles, schema, and conventions.
- **`docs/decisions/00N_*.md`** — plays the role of `docs/adr/`. Read the ones that touch the area you're about to work in.
- **`docs/runbooks/`** — operational how-tos for recurring tasks (e.g. applying a migration, adding an establishment). Not part of the skill's default template, but read the relevant runbook before doing the task it covers.
- **`AGENTS.md`** at the repo root — the "Reglas de Oro", not obvious from the code alone.

Single-context repo (this one is): no `CONTEXT-MAP.md`, no per-context docs under `src/*`.

Note: `AGENTS.md` also points at `knowledge/vision.md` and `requirements/epics.md` — neither exists yet. Don't fabricate content for them; if a skill needs vision/requirements context that isn't in `docs/architecture.md` or the ADRs, say so rather than guessing.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `docs/architecture.md`. Don't drift to synonyms the doc explicitly avoids.

If the concept you need isn't documented yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap worth noting.

## Flag ADR conflicts

If your output contradicts an existing decision in `docs/decisions/`, surface it explicitly rather than silently overriding:

> _Contradicts ADR 002 (multi-tenant RLS) — but worth reopening because…_
