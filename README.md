# Usage Saver

A Claude Code skill that tells you which Claude model and effort a job needs before the work starts, and asks before it runs on the wrong one.

I used to leave every chat on the biggest model. Then I ran the same seven-part coding job three times and scored each run with hidden tests that none of the models got to see:

| Chat ran on | Cost | Hidden checks passed |
|---|---|---|
| Fable 5.2, medium effort | $2.26 | 253 of 253 |
| Opus 5.5, medium effort | $1.54 | 253 of 253 |
| Sonnet 5.5, high effort | $0.85 | 253 of 253 |

Every check passed on all three, and the cheapest run cost 62% less than the dearest. It was a job all three could handle, and it was not quite a tie: Sonnet's docs came out about half as detailed.

All three runs had this skill loaded. The saving comes from the model, not from the skill. What the skill does is tell you which model is enough before you spend the money. In the Fable run its first line was "Opus 5.5 medium would do for this".

Fable 5.2 is the top Claude model as of November 2026, one tier above Opus.

> [!NOTE]
> Early project. One author, one machine, single runs. Costs are API list prices applied to the token counts in Claude Code's own transcripts. Read [what the numbers do and don't show](#what-the-numbers-do-and-dont-show) before you rely on them.

## Install

```bash
git clone https://github.com/Lampe332/claude-usage-saver ~/.claude/skills/usage-saver
```

On Windows PowerShell:

```powershell
git clone https://github.com/Lampe332/claude-usage-saver "$env:USERPROFILE\.claude\skills\usage-saver"
```

Open a new chat in Claude Code and type `/usage-saver` followed by your task. The two helper scripts are optional and want Node 18 or newer.

To update: `git -C ~/.claude/skills/usage-saver pull`. To remove it, delete that folder.

## What it looks like

```
> /usage-saver We're rebuilding the app in four phases. Start with phase 1.

Usage Saver on. Recommended for this job: Opus 5.5 medium
(project in phases, builder agents do the work).
This chat runs on: Fable 5.2.

As a planner Fable costs roughly 20 to 45% more than Opus
and charges the top-model limit.

  1. Switch (recommended)   change the model in the menu, then write "go"
  2. Start here             carry on in this chat as it is
  3. Handover prompt        pack this chat into a start prompt for a new chat, then stop
```

If the chat is already on a fitting model you get one line, "Fits, starting.", and it goes to work.

"Top-model limit" refers to subscription plans, where the top model has its own weekly allowance. On an API key, read it as "the expensive one".

From there it keeps the bill down in four ways:

- It does small pieces itself. No subagent for a two-line fix.
- Bulk work becomes a script. Converting 270 call sites across 48 files took 11 steps that way.
- It delegates only what is large: heavy reading goes to Haiku, long runs to Sonnet or Opus, each at the lowest effort that is enough.
- Past roughly 200k tokens of history it proposes a new chat and writes the handover prompt for it, because every step re-reads the whole history.

Every agent result gets a spot check before it is reported as done.

## What it does not do

It cannot switch the model for you. Claude Code does not let a chat change its own model, so the click in the model menu is yours.

It will not make a chat cheaper that is already on the right model. There it only adds overhead, because loading the skill costs about 6k tokens and the announcement costs a step:

| Job, chat on Fable in both runs | Without the skill | With the skill |
|---|---|---|
| Five small tasks | $1.36 | $1.78 (+31%) |
| Large clean-up of 48 modules | $1.79 | $1.91 (+7%) |

Use it when you start something and are not sure which model it needs, or on projects that run for hours. Skip it for one-liners.

It only knows Claude models.

It is a prompt, not code. The model reads the ladder and the rules in `SKILL.md` and judges your job against them. Nothing enforces the outcome.

It is not proven on really hard code. Every test job was one that all three models could finish. For unfamiliar code, unclear bugs and architecture the skill still recommends the top model, and that advice rests on the benchmark figures, not on a test of mine.

## Why it does not fan out to subagents

The first version did what most "orchestrator" setups do: plan in the main chat, hand every piece to a subagent on the cheapest model that might manage. I measured it.

| Five small tasks | Cost |
|---|---|
| The chat does everything itself | $1.36 |
| Planner plus four subagents | $4.61 |

That is 3.4 times the price for the same output. A subagent reads the whole base context before it does anything. The planner then pays three more times: for writing the brief, for being woken when the agent reports, and for checking the result.

| Subagent on | Start-up fee | With brief, report and check | Pays off from about |
|---|---|---|---|
| Haiku 5.5 | $0.01 | $0.15 | 3 tool calls, or lots of reading |
| Sonnet 5.5 | $0.09 | $0.25 | 8 tool calls |
| Opus 5.5 | $0.18 to $0.36 | $0.40 | 20 tool calls |
| Fable 5.2 | $0.35 to $0.74 | $0.85 | never, on cost alone |

The fees are measured on a setup with about 72k tokens of base context (many tools and skills installed). The "pays off from" column is extrapolated from them, not tested call by call. Your base context is probably different, which is what `cost.mjs` is for.

So the rule in the skill is: do it yourself, unless there is a lot to read, the run is long, an independent check is needed, or you asked for a team.

## The model ladder

When the skill does delegate, it starts at level 3 and moves down or up for a reason it has to state.

| Level | Model | Effort | $/task | Index | Code % | Terminal % | Used for |
|---|---|---|---|---|---|---|---|
| 1 | Haiku 5.5 | high | 0.16 | 30 | 23 | 22 | Searching, collecting, reading and summarising |
| 2 | Sonnet 5.5 | high | 1.64 | 42 | 26 | 44 | Text, docs, research, simple scripts |
| 3 | Opus 5.5 | medium | 2.45 | 48 | 33 | 53 | Routine code with a test or template, builds, clear bug fixes |
| 4 | Fable 5.2 | low | 3.10 | 54 | 38 | 55 | Several files, own decisions on familiar ground |
| 5 | Fable 5.2 | medium | 3.80 | 56 | 41 | 55 | Unfamiliar code, unknown formats, unclear causes |
| 6 | Fable 5.2 | high | 9.08 | 62 | 49 | 60 | Costly errors that no check would show |

The figures are from [Artificial Analysis](https://artificialanalysis.ai/providers/anthropic): cost per task of their Intelligence Index, the index itself, FrontierCode-AA 2.0 and Terminal-Bench 4.0. `$/task` is their cost for one task of their benchmark suite, not one of my jobs. Use it to compare rungs, not to predict a bill. All 20 model and effort combinations are in [aa-data.md](aa-data.md).

Effort is the pricier dial. Going from Fable medium to Fable high costs 2.4 times as much, while going from Opus medium to Fable medium costs about 1.6 times. Some settings are plainly bad deals too: Sonnet at low or medium effort loses to Haiku at high on index, code and price.

## Where the usage really goes

I ran `cost.mjs` over a real day of work on a multi-phase app project. The planner chat, on Opus, was 14% of the bill. The builder agents were 86%. The most expensive single item was one builder run of 160 steps whose history grew to 539k tokens: $27.

That is why the skill splits work into runs of about 100 steps at most and nags about long chats. The 100 is a rule of thumb from that one session, not a tested threshold. The planner's own model turned out to be a small lever. How it cuts up the long runs is the big one.

## Measure your own sessions

```bash
node ~/.claude/skills/usage-saver/cost.mjs
```

It reads Claude Code's transcript files and prints what each recent session cost, main chat and subagents together, split by model:

```
2026-11-13 11:38  ·  $4.61  ·  4 subagents  ·  5 min  ·  "five small tasks, old version"
   fable    $   3.30     23 calls      2.6M read      23k output
   opus     $   1.06     16 calls      1.4M read      12k output
   sonnet   $   0.25      6 calls      0.5M read       7k output
```

`node cost.mjs 12` shows the last twelve sessions, `node cost.mjs <text>` the ones whose first message contains that text. Nothing leaves your machine.

## Refresh the benchmark data

```bash
node ~/.claude/skills/usage-saver/aa-update.mjs
```

This fetches the current Claude figures from Artificial Analysis and rewrites `aa-data.md`. When a new model generation ships, edit the `FAMILIES` list at the top of the script, run it, and update the ladder in `SKILL.md` to match. The script tells you when it sees model families it does not know.

## What the numbers do and don't show

- Every figure is a single run. I have not measured the spread between runs.
- Dollars mean API list prices times the tokens recorded in the transcripts. A subscription may weigh models differently. On mine the top model has its own weekly limit, which is the main reason I care about moving work off it.
- The test project is synthetic: a 48-module Node project generated by a script, with three planted bugs. The hidden tests were written before the runs and checked against a reference solution first.
- The tests cover jobs all three models could do. They say nothing about where the smaller models start to fail.
- Models as of November 2026: Fable 5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5.

## Credits

Benchmark figures are the work of [Artificial Analysis](https://artificialanalysis.ai). This project is not affiliated with them or with Anthropic.

MIT licensed, see [LICENSE](LICENSE).
