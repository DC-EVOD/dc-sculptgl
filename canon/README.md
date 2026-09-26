# canon/ — Ascent/Fall canon files produced in this repo

## Why these files are here and not in the skill

The canon-keeper skill states the archive lives at
`/mnt/skills/user/ascent-fall-design-law/references/canon/`.
**That path does not exist in this container** (checked). The mounted copy of the skill lives under
`/root/.claude/skills/synced/<id>/ascent-fall-design-law/`. That directory reports writable, but it is a
**synced** copy inside an ephemeral cloud container: writing there would neither reach the installed
skill on David's machine nor survive the container being reclaimed. So nothing was written there.

These files were written into the repo instead, because the repo is the only location that is both
durable (via commit + push) and openable from the Claude app.

## To actually grow the archive (canon-keeper Procedure 4)

This has **NOT** been done — it needs David's go-ahead:
1. Copy the whole `ascent-fall-design-law` skill folder to a writable location.
2. Drop `2026-09-26-orocy-chthonokaen-sorrow-resonant.md` into its `references/canon/`.
3. Replace its `references/canon/INDEX.md` with `canon/INDEX.md` from this repo.
4. Re-package with `skill-creator/scripts/package_skill.py` (present on disk, not run).
5. Install the resulting `.skill` in the **desktop browser** (Settings → Capabilities/Skills, with Code
   Execution & File Creation ON — path last known, verify it is still there). The mobile app cannot
   install skills. Packaging is not installing. Skills load at the start of a **fresh** chat.

## Correction logged 2026-09-26

An earlier statement in this session that the archive had **no `name-ledger.md`** was **wrong**. It was
checked only under `ascent-fall-design-law/references/`. It exists at
`ascent-fall-canon-keeper/references/name-ledger.md` and holds established entries — including
**Vorujkai: "storm elemental; charge types / force carriers"** — which is load-bearing for the
2026-09-26 Vorujkai ruling. Canon-keeper requires reading it before any dossier pull; it has now been
read in full.

## Files

- `2026-09-26-orocy-chthonokaen-sorrow-resonant.md` — the registration: entries labelled
  ESTABLISHED / PROPOSED / OPEN, convergence table against the older strata, the Archivist's Reading.
- `source-prose/2026-09-26-orocy-burning-planet-verbatim.md` — the primary source, verbatim and
  uncorrected. The extraction manifest names lost scene prose as a standing gap; this closes one.
- `INDEX.md` — proposed replacement for the skill's INDEX. Existing 2026-07-06 entries preserved
  byte-for-byte (built by copying the original, not retyping it); 2026-09-26 subjects appended, and the
  Drohj and Nuru'Toron lines extended.
