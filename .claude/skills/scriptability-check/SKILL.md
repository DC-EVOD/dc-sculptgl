---
name: scriptability-check
description: Prefer a complete one-time Windows PowerShell automation when the user initiates a local build, setup, workflow, automation, or pipeline objective intended for C:\\Users\\DCEVO-D\\AUTOMATON BUILDS. Do not activate for ordinary questions, conceptual design, prose, image generation, remote-only operations, or work that cannot be completed safely as one local script.
---

# Scriptability Check Protocol

For an applicable task, make this binary decision before proposing a workflow:

> Can this task be completed as a one-time, copy-paste PowerShell script targeting `C:\Users\DCEVO-D\AUTOMATON BUILDS`?

## If yes

Lead with one complete, self-contained PowerShell script that performs the requested local work end to end. Do not replace it with a manual tutorial or preliminary plan.

The script must:

- Default its working/output root to `C:\Users\DCEVO-D\AUTOMATON BUILDS`, while using task-specific child paths.
- Be safe to paste and run, with clear variables at the top for genuinely necessary user inputs.
- Validate prerequisites, paths, and command availability before mutation.
- Create required directories and files, handle expected failures, and print a concise completion summary.
- Be idempotent where practical and avoid destructive overwrite or deletion unless the user explicitly requested it.
- Never embed, extract, or print secrets. Use normal authenticated tooling or prompt securely when credentials are required.
- Avoid paid services and dependencies unless the user explicitly authorizes them.
- Include only the minimum run instruction or unavoidable caveat outside the script.

If the requested result needs content generation, include that content in the script (for example, here-strings or generated configuration) so the user does not have to assemble multiple fragments.

## If no

Proceed with the most effective normal workflow. A task is not one-script-completable when it depends on unavailable credentials or permissions, irreversible choices the user has not made, interactive visual judgment, remote services without scriptable access, or deliverables that cannot be faithfully produced by PowerShell alone.

Do not force PowerShell around a task merely to satisfy the preference. Explain the blocking fact briefly only when it affects what the user should do next.

## Scope and authority

This skill controls response format and local automation preference; it does not expand filesystem, network, account, spending, publishing, or destructive-operation authorization. Follow the user's exact requested scope and all active execution constraints.
