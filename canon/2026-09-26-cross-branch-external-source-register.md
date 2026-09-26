# CROSS-BRANCH & EXTERNAL SOURCE REGISTER
**Compiled 2026-09-26** · canon-keeper, under the AUDITER
**Why this exists:** the keeper was blind to four other branches of this repo and to a ~4 GB export
sitting on David's own machine. This records what exists where. It is a **finding aid**, not lore.

---

## 1. THE DIRECT ANSWER: NO RESCUED GPT OR COPILOT LORE EXISTS IN THIS CONTAINER

David asked to "grab all the rescued stuff u got from gpt and copilot." **I searched before answering,
per the NULL-CLAIM law. There is none here.** Receipts:

- **`grep -rin "chatgpt|copilot|gpt|gemini|openai"` across all 44 mounted skills.** Every Ascent/Fall
  hit is a **gap record or a ruling-out**, never rescued content:
  - chat #3, *"Shared ChatGPT conversation"* — **PARTIAL**; *"6 of 7 Magika Field sphere names live in
    external ChatGPT doc (known standing gap)"*
  - *"Six of seven Magika Field sphere names — external ChatGPT document, **unreachable**."*
  - Enoqeth temple geometry — *"a **GPT-era proposal was rejected**; the user's own vision pending."*
  - **"Desire" entity** — *"from a prior GPT document; user ruled it **non-canon** (2026-06-12)."*
  - *"Drōhj/Enoqeth design-law split **correcting Gemini's Melt unification**"*; *"**Gemini-lane source
    caution**"*; *"external-parallel quarantine rule."*
  - **Kūl'Rā'Qæl** creation writing — likely homes include *"Gemini-side docs"*; **never recovered.**
- **`find` over `/home`, `/tmp/claude-0`, `/root`** for any file named `*gpt*`, `*copilot*`, `*gemini*`,
  `*rescue*`, `*export*`, `*conversations*` → **nothing** (two unrelated Python files in a uv cache).
- **`git grep` across all four other branches** → the only hits are the two in §3 below.

**`COPILOT` appears NOWHERE — zero hits in 44 skills, five branches, and the filesystem.** If Copilot
material was rescued, it was not rescued into anything this container can see.

---

## 2. WHERE THE GPT RESCUE ACTUALLY IS — found, named, and on David's own machine

This is the real lead, and it came out of `kitbash/tidy_downloads.ps1` on branch
`claude/vibrant-knuth-e9ez4u`, verbatim from its comment:

> `# AI / chat EXPORT ARCHIVES are .json but they are archives, not code. Measured`
> `# 2026-09-26: chatgpt-files-part07.json 209 MB, af-claude-binaries-part03 94 MB.`
> `# 65 such files carried ~4 GB and were being filed as source code.`

And the routing rule that catches them:
> `if ($name -match '(?i)^(chatgpt|chat-|claude|af-claude|conversations|openai)|-r?part\d+\.json$') {`
> `  return '08 Docs & Ascent-Fall\Research archives'`

**So, ESTABLISHED by measurement (another session's tool call, recorded in that script):**
- A **ChatGPT data export exists**, split into parts — `chatgpt-files-part07.json` alone is **209 MB**.
- An **Ascent/Fall Claude export exists** — `af-claude-binaries-part03`, **94 MB**.
- **65 such files, ~4 GB total**, on David's Windows machine under `C:\Users\DCEVO-D`, now routed to
  `08 Docs & Ascent-Fall\Research archives`.

**This is almost certainly the "rescued stuff from GPT."** It is reachable **by David, not by me** —
this container has no access to his filesystem. **It is very likely to contain the standing gaps:** the
six missing Magika Field sphere names, the Kūl'Rā'Qæl creation writing, and the chat #3 canon-lock draft
texts are all recorded as living in exactly such external docs.

**NEXT ACTION FOR DAVID (highest value available):** those ~4 GB of export JSON are the single largest
unmined body of Ascent/Fall material known to exist. Upload one part, or a search of it, and it can be
composted properly.

---

## 3. WHAT DOES EXIST ON THE OTHER BRANCHES — real, unpooled, and mostly CRAFT not LORE

Four branches exist on `origin` beyond `main`. Three carry work the keeper has never seen. **Stating
what each record describes, never what it fails to be** (Architekt law):

### `claude/blissful-allen-dfygyi` — **THE FORGE LEDGER** (craft)
`forge/ledger/` — **eleven tutorials transcribed in full: 501,284 characters** of verbatim transcripts in
`raw/`, distilled into a **two-track technique ledger deliberately kept unmerged**:
- **ZBrush track** — sculpt-led: mask-and-extract, Dynamesh design exploration, ZRemesher-by-polygroup,
  surface-noise passes, edge damage, layers + morph target, IMM hardware, curve-IMM stitches, polypaint.
  Sources: **TriGon** (163,298 chars — the backbone), **Hristian Shyne**, **Gatz 3D** (the five-stage
  spine for a ~50-piece harness: block out → 3D sketch → split → thicken → refine), **Royal Skies**.
- **Blender track** — modifier-led: **shrinkwrap panels on a smooth base**, exact parametric operations,
  panel seams, thickness law, **the centre-line asymmetry rule**, multires vs remesh, radial duplication,
  Spin-tool exact values, Wall Factory parameters, fractal subdivide. Sources: **Abe Leal 3D** (147,784
  chars), **Ironbark Games**, **Baril3D** (armour + helmet).
- `bridge-zbrush-blender.md` — *"the only place they touch, and it covers the handoff, not a blend."*
- `pipeline-spine.md` · `macros-and-tooling.md` · `engine-handoff-unity.md` · an **8-page PDF reference
  card** (`dc-armour-reference.pdf`) + its generator · the `panel_stack` Blender engine.
- **Its own provenance law, quoted:** *"Every technique here came out of a transcript in raw/. If a claim
  is not in raw/, it does not belong in this ledger."* And an honest gap: *"Timestamps are NOT available.
  YouTube's caption API refuses this network (IpBlocked)... So nothing here is cited to a timecode."*
- **Note:** `raw/pipeline-stefan3dai-opus-*.txt` is a tutorial transcript that *discusses* GPT-6 vs Opus
  in Blender. **It is a YouTube transcript, not rescued GPT lore.** Do not mistake it for one.

### `claude/vibrant-knuth-e9ez4u` — **THE KITBASH MUSTER** (craft / asset inventory)
`kitbash/STATE_2026-09-26.md` — a measured inventory of David's own disk, and a **plan correction** in
his own AUDITER's spirit: *"A large part of that already exists on his disk... Building it again would
repeat the exact failure his AUDITER logs — inventing what real reference already holds."*
- **Measured:** 632,210 files walked · 2,401 candidates · **2,163 model files, 1,890 distinct by hash
  (12.6% duplication)** · **5,954 MB loose** · **76 zips holding models, NOT extracted** · extension
  split `.obj` 1,649 / `.fbx` 411 / `.glb` 93 / `.gltf` 10 — **76% OBJ.**
- **Already on his disk, verified by directory listing:** an **18-part HIGH/LOW paired armour set** with
  correct harness nomenclature · **five `*_GROUPED.obj` IMM source files** ready for Create
  InsertMultiMesh · a **32-piece trim atlas**, 18 base shells, 24 decor inserts, 6 cloth blockouts · a
  **10-kit IMM library** (4-file-per-part convention) · a completed **high→low projection test** · a
  parts-library GLB and a static assembly.
- Plus `muster.ps1`, `tidy_downloads.ps1`, and a `scriptability-check` skill.
  (`agents/openai.yaml` in it is a **7-line agent display config** — *"Turn local objectives into
  one-shot PowerShell."* **Not GPT content, not lore.**)

### `claude/github-installation-ndd4ke` — **THE ISO ASSET CONSTITUTION** (craft)
A repo-level `CLAUDE.md` isometric game-asset constitution, plus a neutral asset-library scaffold:
`assets/_manifest/registry.json`, `spec-template.md`, and the characters / environment-modular /
tiles2d / materials / props / textures tree.

---

## 4. CLASSIFICATION — stated plainly, so nothing is miscategorised

**None of §3 is lore.** It is technique, pipeline, and asset inventory. It is genuine Ascent/Fall project
material and it is now **recorded** here so the keeper is no longer blind to it — but it is **not**
composted into the canon archive as lore, because it is not lore, and filing craft as canon would
corrupt both. Its proper homes are the craft skills: `ascent-fall-procedural-assets`,
`ascent-fall-iso-pipeline`, `ascent-fall-armory`, `3d-modeling`, `game-art-topology`,
`game-art-texturing`.

**What IS lore-relevant here** is exactly one thing, and it is a **gap location**, not content: **§2 —
the ~4 GB of ChatGPT/Claude export JSON on David's machine, which is where the missing Magika Field
sphere names, the Kūl'Rā'Qæl creation writing, and the chat #3 canon-lock drafts are most likely to be.**

---

## 5. OPEN
- **Does David mean something else by "rescued from gpt and copilot"?** If he rescued material in a
  session whose branch is not on this remote, or into a local file on his own machine, **it is not
  reachable from here and I have not seen it.** Naming the file or uploading it closes this instantly.
- **Copilot: no trace at all.** If Copilot material exists, where?
- Whether the 76 unextracted zips or the 2,163-model heap contain canon-bearing assets (they are
  recorded as models, not lore).
