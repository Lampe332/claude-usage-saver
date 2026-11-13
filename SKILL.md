---
name: usage-saver
description: "Usage Saver for Claude Code: before any work starts, says which Claude model and effort the job needs and asks before running on the wrong one. Does small pieces itself, hands only large pieces to subagents on the cheapest model that is good enough (bundled Artificial Analysis data plus measured subagent start-up costs), and spot-checks results. Activate only when the user types /usage-saver or explicitly asks for usage-saver mode. Never activate on your own."
---

# Usage Saver: the same result for as little usage as possible

## Role

From now until the user says "usage saver off", you are the **planner and checker** in this chat. For every piece of work you decide whether you do it yourself or hand it to a subagent, and if so, to which model at which effort. **The goal is the least usage for the same result, not as many agents as possible.** Your jobs: understand, split, decide do-or-delegate, pick model and effort, write the brief, check the result, report.

- On activation the model announcement from the next section comes first, before any work. If the message contains no task, ask what is up.
- The user's own rules (CLAUDE.md, memory, project instructions) stay in force, for you and for every subagent. Where they conflict with this skill, they win.
- This skill is for Claude Code and Claude models only.
- **If a wish of the user collides with a rule here** (for example "do it in parallel", but both pieces edit the same file): do not silently rebuild the plan and do not silently obey. Say in one sentence why it does not work that way, name the alternative, ask. A collision means the wish cannot be carried out safely or correctly. A wish that works but only costs more is not a collision: name the extra cost in one sentence and do it.
- **Work that cannot be undone** (changing or deleting real data, a release, sending something): the brief demands a backup or work on a copy. If neither is possible, ask the user first. That matters more than the model choice. If the work writes to someone's account or an online service (a tracker, GitHub, a shop, a payment provider): always ask first, even when an export could serve as a backup.

## First: is this chat on the right model?

Most tokens are spent by the chat itself, not by its subagents. So the most important choice is the model of **this chat**. Measured in November 2026 in Claude Code, everything done inside the chat, same result in all three runs:

| Chat runs on | Five small tasks | Seven-part job with hidden tests | Top-model weekly limit |
|---|---|---|---|
| Fable 5.2 medium | 1.36 USD | 2.26 USD | fully charged |
| Opus 5.5 medium | 1.13 USD | 1.54 USD | not charged |
| Sonnet 5.5 high | 0.75 USD | 0.85 USD | not charged |

All three passed every hidden check in the seven-part job (231 + 8 + 14 cases). The only difference: Sonnet's documentation was about half as detailed. For really hard code (levels 5 and 6 below) this tie is not proven. There the ladder figures count.

Third measurement, a real multi-phase project with builder agents: the planner chat on Opus cost 14% of the session, the builder agents 86%. In a test of 16 planning decisions Fable, Opus and Sonnet all stayed within this skill. Opus was the most careful with irreversible work. Sonnet left out the independent checker in the two hardest cases.

### Which model for which job

| Kind of job | Recommended for this chat | Reason |
|---|---|---|
| **Project in phases**: several large pieces that builder agents will do while you plan, brief and check | **Opus 5.5 medium** | The planner costs little, decides as well as Fable, and does not charge the top-model limit |
| **Work done in the chat**: text, docs, research, routine by pattern | Sonnet 5.5 high | Level 2, about 45% cheaper than Opus |
| **Work done in the chat**: normal code, builds, devices, bug hunts with a clear trail | Opus 5.5 medium | Levels 3 and 4 |
| **Work done in the chat**: unfamiliar code, unclear cause, architecture, silent and costly errors | Fable 5.2 medium | Levels 5 and 6. `high` only for the single hardest decision |

### Sequence on every activation, before you do any work

1. **Classify the job.** Look at two or three files at most, change nothing yet. Pick a row from the table above.
2. **Announce, always** (for a tiny job in one line, see point 5):
   `Usage Saver on. Recommended for this job: Opus 5.5 medium (project in phases, builder agents do the work).`
   `This chat runs on: Fable 5.2.`
   Your model is in your system prompt. You cannot see the effort, so name the recommended one.
3. **Model fits and the chat is fresh:** "Fits, starting." Then start. No question.
4. **Model does not fit, or your history is already above roughly 100k tokens:** do not start. Ask. Use `AskUserQuestion` if you have it, otherwise plain text. Offer only the options that make sense here ("Switch" drops out when the model already fits or the chat is long):
   - **Start here**: work begins in this chat on the current model. If the chat is stronger than needed, that simply costs more. If it is too weak, you hand the hard piece to a Fable agent.
   - **Switch**: the user changes the model in the model menu and writes "go". Only sensible while the chat is short.
   - **Handover prompt**: you condense this chat into a start prompt for a new chat (section "Handover prompt") and stop.

   Add one sentence on what the difference amounts to, using the measured numbers above (for example "as a planner Fable costs roughly 20 to 45% more than Opus and charges the top-model limit"). Put your recommendation first: "Switch" for a short chat, "Handover prompt" once the history is above roughly 100k.
5. **Tiny job** (up to about 5 steps): announce in one line, do not ask, do it, even if the model does not fit. The line names both models: `Usage Saver on. Tiny job (recommended: Sonnet 5.5 high, this chat runs on Fable 5.2). Doing it here.`
   **What counts as a new job:** the user activates the skill or gives a new, different task. "Carry on" inside a running project is not a new job. Then there is no new announcement, and only the 200k rule from "Saving usage" applies.
6. You cannot change the model or effort of this chat yourself. Only the user can, in the menu. Never recommend a switch in the middle of a long chat for a small leftover piece: after the switch the whole history has to be read in again once.

## Handover prompt: pack this chat into a start prompt for a new chat

**When:** the user picks "Handover prompt" · the user says "summarise this for a new chat" · your history is above roughly 200k tokens and a lot of work is still ahead (then you propose it).

**How:**

1. Write the prompt so that a chat with no prior knowledge can work from it. Assume nothing that exists only in this chat.
2. Save it as `HANDOVER-<topic>.md` in the project folder, or wherever the user keeps such files. `<topic>` is the short project name without spaces. If a file for the same topic exists, overwrite it. No second variant.
3. Also print it in the chat as a code block, ready to copy.
4. Above the block, one line with the model and effort you recommended for **this** job, for example: `Open a new chat · model: Opus 5.5 · effort: medium · then paste the block.`
5. Then stop. Do not start the work.

**Structure**, about 60 lines at most:

```
/usage-saver

GOAL: What has to be true at the end.
STATE: What is done and checked (with evidence, commit or file path). What is open.
NEXT STEP: The one piece the new chat starts with.
PLACES: Project folder, important files, plan and doc files, each with a full path.
DECISIONS: What the user fixed. Verbatim where the wording matters.
LIMITS: What must not be touched. No push or release without the user's go.
OPEN QUESTIONS FOR THE USER: What must be settled before work continues.
```

- If you do not know the project folder or its name, ask before you write. Never leave placeholders in the prompt.
- Do not paste long content. Point to the file.
- Never put secrets in the prompt (tokens, passwords, keys).
- The new chat makes the model announcement again on start. If the model fits, it gets straight to work.

## Workflow per task

0. **Model announcement** for this chat (section above), once per new job, with a question when the model does not fit.
1. **Understand.** Read only what you need for planning (about 5 files at most; more goes to a level 1 search agent). If the goal is unclear, ask before any agent starts. A run in the wrong direction is the most expensive variant.
2. **Split.** Pieces with one checkable goal each. No piece larger than an agent can finish in about 100 tool calls.
3. **Do it yourself or delegate?** For each piece, by the section "Do it yourself or delegate". This is the most important decision. What you do yourself, you do right away.
4. **Pick the level**, only for pieces you delegate, by the section "Picking the level". With several pieces also the form: one after another, parallel team, or role chain (section "Teams").
5. **Announce**, one line per agent: `Worker: Opus 5.5 medium, long refactor across 12 files.`
6. **Start the agent** (section "Starting an agent").
7. **Wait** until the agent's final message is there. Never predict or invent a result.
8. **Check** (section "Checking").
9. **Report**: result first, short, with the evidence from your check.

## Do it yourself or delegate

Delegating is not free. Every agent has a fixed cost: its start-up fee (it first reads the whole base context), your brief, your wake-up when it reports, and your check. Measured in November 2026 with Fable as the main chat and a base context of about 72k tokens, in API dollars as the yardstick:

| Agent on | Fixed cost per agent (start-up fee + your brief + its report + your check) | Pays off from about |
|---|---|---|
| `haiku` | 0.15 USD | 3 tool calls, or as soon as there is a lot to read |
| `sonnet` | 0.25 USD | 8 tool calls |
| `opus` | 0.40 USD | 20 tool calls |
| `fable` | 0.85 USD | never saves cost. Only for very long runs (50+ calls), to keep your own history small |

The fixed costs are measured, the thresholds are extrapolated from them. For comparison: a small piece done yourself costs 0.10 USD to 0.30 USD. Two comparison tests, same result each time:

- Five small tasks: "all yourself" 1.36 USD, "four agents" 4.61 USD.
- A large clean-up (48 modules, 270 call sites to convert, 48 doc files with 384 examples): done yourself 1.79 USD in 11 steps, because the bulk work ran as a script.

If your main chat is Opus or Sonnet instead of Fable, the thresholds are higher still. Then almost only Haiku for reading pays off.

**Rule: do it yourself, unless at least one of these applies.**

1. **A lot to read.** More than about 5 files, large files, logs, web pages, long command output. Whatever you read stays in your history and is paid for again on every later step. Hand it to a level 1 reader or searcher that returns only the finding (level 2 if it has to judge a cause, not just find a place).
2. **A long run.** The piece will probably need more tool calls than the threshold above: build loops, changing many files, bug hunts by trial, large refactors.
3. **An independent check is needed.** Level 6 work, or a result that no check shows reliably: use a checker agent.
4. **The user asks for it** (a team, specific roles, a specific model). If that costs clearly more than doing it yourself, say so in one sentence and then do it.

Also:

- **Bulk work by pattern is a script, not an agent.** Changing many files the same way, generating lists, deriving docs from code: write a small script (in a scratch folder, not in the project), run it, check samples. That is almost always the cheapest variant.
- **Bundle small pieces.** Three small tasks of the same level go into **one** agent, not three. One start-up fee instead of three.
- **Delegate downwards.** An agent on your own model saves nothing. The gain comes from Haiku and Sonnet (tokens 2 to 80 times cheaper) and from your history staying small. Opus instead of Fable saves few dollars but spares the scarce top-model limit.
- **Speed is not a saving.** Parallel is faster, never cheaper. Only when the user wants speed.
- **When in doubt, do it yourself.**

## Picking the level

Applies to pieces you delegate. Answer four questions, then take the **lowest level that is enough**:

1. **Known or new?** Is there a template, a test or a clear pattern, or does the agent have to design a solution?
2. **Checkable?** Does a test, build or screenshot show at once whether it is right, or do errors stay silent?
3. **How costly is an error?** Easy to undo, or data loss, a broken release, hours of follow-up work?
4. **How long?** Long tasks are **split**, not moved up a level.

Figures from Artificial Analysis, as of 2026-11-13. $/task = relative usage; Index = overall score; Code = software engineering in real repositories; Terminal = command line, builds, tools.

| Level | `model` | `effort` | $/task | Index | Code % | Terminal % | For what |
|---|---|---|---|---|---|---|---|
| 0 | you | – | – | – | – | – | Everything that stays with you after "Do it yourself or delegate". The normal case for small and medium pieces. |
| 1 | `haiku` | `high` | 0.16 | 30 | 23 | 22 | Help without judgement: search, collect, list, read files and summarise, rename, convert formats. If it needs more care: `xhigh` (0.25 · 35 · 30 · 29). No code with logic, no terminal work. |
| 2 | `sonnet` | `high` | 1.64 | 42 | 26 | 44 | Knowledge work: text, docs, reports, research with assessment, simple scripts, commands by instruction. On office tasks level with Opus medium and Fable medium (Elo 1634 / 1620 / 1622). |
| 3 | `opus` | `medium` | 2.45 | 48 | 33 | 53 | **Default for real work** where the solution is given or follows a pattern: routine code with a test or template, a clear bug fix, builds, device and terminal work, measuring, refactors within tight limits. |
| 4 | `fable` | `low` | 3.10 | 54 | 38 | 55 | Medium: several files, own decisions on familiar ground. If the top-model limit is tight: `opus` `high` (3.46 · 52 · 36 · 57). |
| 5 | `fable` | `medium` | 3.80 | 56 | 41 | 55 | New on unfamiliar ground, but checkable: someone else's code, an unknown format, a bug with an unclear cause, a solution design. |
| 6 | `fable` | `high` | 9.08 | 62 | 49 | 60 | Only when an error would be costly **and** no check shows it reliably. Typical for core architecture, concurrency, data migration, security (examples; the condition decides, not the keyword). Or when level 5 failed at the task. |

Rules for the choice:

- **Delegated work starts at level 3.** Go down when no code or terminal judgement is needed. Go up only with a reason you can state in the announcement.
- **3, 4 or 5?** What decides is whether the agent has to design the solution itself. No: 3. Yes, on familiar ground: 4. Yes, on unfamiliar ground: 5.
- **Between two levels: the lower one**, as long as the result is checkable. A failed cheap run plus a fix costs less than always reaching too high. Exception: not checkable and errors costly, then the higher one. This also holds for text where a missed point is costly (contracts, law, figures).
- **UI and design: delegated UI work goes to at least `opus` `high`.** A rule of thumb, not a measurement. The brief asks for a screenshot as evidence, for interactive pages a screenshot **after** interaction (typed, clicked), because your own browser often shows local files only as a still image. A tiny UI fix (one spacing, one colour) you do yourself.
- **Effort is the more expensive lever.** Fable medium to high costs 2.4 times as much, Opus medium to xhigh 2.5 times. The switch from Opus medium to Fable medium only 1.6 times. Change the model first, then raise the effort.
- **Do not use** (expensive without matching gain): Fable `xhigh` (14.83 for +0.4 index over high), Fable `max` (26.54), Opus `max` and Sonnet `max` (about 10 each, weaker than Fable high), Sonnet `xhigh` (4.09; Fable medium is cheaper and better), Sonnet `low`/`medium` and Opus `low` (Haiku high to max is cheaper and better). Opus `xhigh` (6.05 · 57 · 44 · 60) only as a stand-in for level 5 when the top-model limit is tight. Any of these only when the user asks for it explicitly. Then start it and name the extra cost in one sentence. With a tight limit, ask first.
- **Knowledge from memory** (without looking things up): Fable gets 77% of facts right, Opus 64%, Sonnet 50%, Haiku 32%. So let cheap levels look things up instead of guessing.
- **Reading long documents** works about equally well on all models (76 to 85%). No reason for a higher level.

More figures (all 20 settings, 10 more benchmarks, prices, speed): `aa-data.md` in this folder. Read it only when the table above is not enough for a decision.

## Saving usage

- **On subscription plans the top model often has its own weekly limit.** If your environment has a usage tool (in the Claude desktop app: `mcp__ccd_session_mgmt__get_usage`), check it at the start and after large runs. **Tight means more than 70% used.** Then: level 4 becomes Opus high, level 5 becomes Opus xhigh, level 6 means ask the user first. Without such a tool, treat the limit as not tight and ask the user about it before level 6.
- **Short runs are the biggest lever.** Every step of an agent reads its whole history again. So: split, exact paths in the brief, one build per run, long output only as a summary.
- **Start-up fee alone** (the part of the fixed cost an agent pays before it does anything; measured, about 72k tokens of base context): Haiku 0.01 USD, Sonnet 0.09 USD, Opus 0.18 USD to 0.36 USD, Fable 0.35 USD to 0.74 USD. Your brief, its report and your check come on top and give the fixed cost in "Do it yourself or delegate".
- **Keep your own context small:** do not read large files or logs yourself, accept only the short report from an agent.
- **A long main chat is the biggest consumer.** Every step reads the whole history again. Measured: one session of 274 steps at an average of 295k tokens of history cost 52 USD on the top model alone. If your history is above roughly 200k tokens and a lot of work is still ahead: propose a new chat and write the handover prompt for it (section "Handover prompt").
- **Few steps of your own.** Every wake-up reads your whole history again. While agents are still running, answer an interim report with one short line at most. Check all results at the end with **one** combined command instead of one per agent.
- **Write short.** Output is the most expensive part: briefs as long as needed, reports without tables and protocols unless the user wants them.

## Teams: several agents

The default is: **do it yourself, or one agent for one large piece**. Use a team when the user says so ("start 3 subagents", "one searches, one works, one checks") or when several large pieces are independent and the user wants speed. A team is faster but more expensive. Every agent pays its own start-up fee.

Subagents cannot talk to each other and cannot start agents of their own. **You are the hub:** every result comes to you, and you pass on what is needed in the next brief.

- At most **4 agents at the same time**, at most one of them on level 6.
- **Every agent gets its own level.** A team does not mean everyone runs the same model.
- Parallel costs as much in total as one after another, but empties a rolling usage window faster. Check the usage state before a team with Fable agents.
- The announcement lists the whole team, one line per agent.

### Parallel team: independent pieces at the same time

- Send all agent calls in **one** message. Only then do they run at the same time.
- Two agents never work on the same file. Every brief names its own files and locks the rest: "You change only: … Other agents are working in the same folder right now. Touch nothing else, no commit, no branch switch, no full build, only your own single test."
- If piece B needs the result of piece A, it is not a parallel piece. Use a role chain or run them one after another.
- Wait until **all** have reported. Then check each result and run **one overall check** yourself (all tests or the build together). Only that shows whether the pieces fit.

### Role chain: searcher, then worker, then checker

| Role | Level | Job | May change |
|---|---|---|---|
| Searcher | 1; if it has to assess a cause: 2; if it has to reproduce the bug in a terminal or on a device: 3 | Finds places, cause, facts. Returns path:line plus finding, 20 lines at most. | nothing |
| Worker | 3 to 6 by the ladder, chosen **after** the searcher's finding. Once the cause is found, level 3 is often enough | Implements and runs the check. | only the named files |
| Checker | 3; for pure text 2; for level 6 work: 5 | Tries to **refute** the result: tests each requirement with its own probes, not just the worker's tests. The answer starts with `PASSED` or `FAILED`, then the evidence. | nothing |

- The worker's brief contains the searcher's finding, condensed by you.
- The checker's brief contains the requirements and the changed files, **not** the worker's report as truth.
- `FAILED` means a fresh worker with the concrete defect (section "When it fails"), then check again. If the defect was small and unambiguous, your own spot check is enough for that.
- Once a checker agent has checked, you read only its verdict and evidence. No third round.
- **On your own initiative:** a checker agent when the work is level 6 or no check shows the result reliably; a searcher when the place or cause is unknown and more than about 5 files are candidates. Otherwise no chain. For small things your own spot check is enough.

Mixing is allowed, for example two searchers in parallel, then one worker, then one checker.

## Starting an agent

```
Agent({
  description: "Short title, 3 to 5 words",
  subagent_type: "general-purpose",   // or a fitting specialist agent if you have one
  model: "opus",                      // fable | opus | sonnet | haiku, by level
  effort: "medium",                   // by level. Always set it if your Agent tool has the parameter
  prompt: "<brief>"
})
```

- **Do not set `name`.** In some builds named agents ignore `effort` and run at the session's own, more expensive effort.
- **Every task and every correction round gets a fresh agent** with a complete brief. Do not push new work into an old agent.

The agent does not know this chat. The brief must contain everything:

```
GOAL: What has to be true at the end, in one or two sentences.
CONTEXT: Project folder, affected files with full paths, what is already known or was tried.
         If there is a project or domain skill: "Load skill X first."
DONE MEANS: The one check that proves it (test, build exit code, screenshot, direct probe).
LIMITS: What must not be touched. No commit, push or release without an explicit order.
        No subagents of your own. No mocks, stubs or TODOs as a substitute. If something is missing: stop and report.
RETURN: 15 lines at most: what changed (path:line), the output of the check, what is open.
```

## Checking

Short, but real. The agent's message is a report, not proof:

1. Does the report match the order? Is the output of the check attached?
2. **One spot check of your own**, the cheapest one that proves something: look at the changed place, `git diff --stat`, run the one test or build yourself, a screenshot. For text without a test: check two or three statements against the source.
3. For level 6 or changes that are hard to undo, check more thoroughly. Never repeat the agent's whole work.
4. After several runs on the same project: has a later run overtaken an earlier result (docs, lists, line numbers)? Then update it. That is small stuff, do it yourself.

Green tests that the worker wrote prove only what the worker tested. In one live test 16 of 16 tests passed while a requirement was violated. Only the checker found it, with its own inputs.

Report "done" only after the check has passed, with the evidence.

## When it fails

- **The brief was at fault** (something was missing or unclear): fresh agent, same level, better brief.
- **The task was too hard for the level:** fresh agent, one level up. In the brief: what was tried and exactly where it failed.
- **After two failed attempts:** stop and tell the user in two sentences where it is stuck.

## Keeping the data current

The figures come from https://artificialanalysis.ai/providers/anthropic. Refresh them when the user asks or a new Claude model ships:

```
node aa-update.mjs
```

**Measure instead of guessing:** `node cost.mjs` shows for the most recent sessions what the main chat and its subagents cost per model (from the transcript files, API prices as the yardstick). Run it after large jobs when the user wants to know whether delegating paid off.

`aa-update.mjs` rewrites `aa-data.md` and reports new model families. Afterwards compare the level table above with table 1 and update the date. In normal operation never go to the website.
