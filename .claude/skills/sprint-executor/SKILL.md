---
name: sprint-executor
description: Use when user says "Execute SPRINT-XX" - iterates through sprint tasks autonomously with context management
---

# Sprint Executor (Sub-Agent Powered)

Executes sprint files by dispatching parallel sub-agents per phase. Each sub-agent gets a fresh context, invokes the appropriate project skill, and implements its task independently.

## Execution Protocol

### 1. Parse Sprint File

Read the sprint file at `.claude/sprints/SPRINT-XX.md` and extract:

- **Phases**: Sections starting with `### Phase X:` (e.g., `### Phase A: Infrastructure`)
- **Tasks per phase**: Uncompleted tasks (`- [ ]`) within each phase
- **Task metadata**: Type tag (`[FE]`, `[BE]`, `[FS]`, `[CONFIG]`, `[BLOCKED]`), description, context, and acceptance criteria
- **Tasks without phases**: If no phase headers exist, treat ALL tasks as a single phase

Create a TodoWrite checklist with all tasks grouped by phase.

### 2. Execute Each Phase (Sequential)

Phases execute in order (A → B → C → D). Within each phase, tasks run in **parallel via sub-agents**.

For each phase:

**A. Dispatch Parallel Sub-Agents**

Launch one `general-purpose` Task tool call per uncompleted task in the phase. All tasks in the phase are dispatched in a **single message** (parallel execution).

**IMPORTANT:** Use the sub-agent prompt template below. Paste the FULL task text into the prompt — do NOT make the sub-agent read the sprint file.

**B. Wait for All Sub-Agents**

All sub-agents in the phase must complete before proceeding.

**C. Handle Git Conflicts**

If two sub-agents modified the same file and git shows conflicts:
1. Identify the conflicting task
2. Resolve the conflict or re-run the conflicting sub-agent on top of the current state

**D. Verify Phase**

Run verification after all tasks in the phase complete:

```bash
pnpm build && pnpm lint && pnpm test
```

If verification fails:
1. Read the error output
2. Dispatch a fix sub-agent with the error and ask it to fix the issue
3. Re-run verification

**E. Mark Tasks Complete**

Edit the sprint file: change `- [ ]` to `- [x]` for all completed tasks in this phase.

### 3. Completion

After all phases are done:
1. Update the Completion Summary table in the sprint file
2. Report final status with per-task summaries
3. Ask user for feedback

---

## Sub-Agent Prompt Template

Use this template for each Task tool dispatch:

```
Task tool (general-purpose):
  description: "Sprint [XX] - [task name]"
  prompt: |
    You are implementing a task from Sprint XX.

    ## Task
    [PASTE FULL TASK TEXT HERE — description, context, acceptance criteria]

    ## Skill Invocation (MANDATORY)
    Before writing any code, you MUST invoke the appropriate skill:
    - [FE] tasks: Invoke the `frontend-engineering` skill using the Skill tool
    - [BE] tasks: Invoke the `backend-engineering` skill using the Skill tool
    - [FS] tasks: Invoke BOTH `frontend-engineering` AND `backend-engineering` skills
    - [CONFIG] tasks: No skill invocation needed

    Your task type is: [TASK_TYPE]

    ## Working Directory
    /Users/giovanedaniel/projects/plim

    ## Your Job
    1. Invoke the skill(s) listed above
    2. Read ONLY the files needed for this task
    3. Implement exactly what the task specifies
    4. Run checks: `pnpm build && pnpm lint`
    5. Self-review your work against the acceptance criteria
    6. Commit your changes with a descriptive message
    7. Report back

    ## Self-Review Checklist
    Before reporting, verify:
    - [ ] All acceptance criteria met
    - [ ] No unnecessary code added (YAGNI)
    - [ ] Follows existing patterns in the codebase
    - [ ] Build and lint pass

    ## Report Format
    When done, report:
    - What you implemented (1-2 sentences)
    - Files changed (list)
    - Self-review result (pass/issues found)
    - Any concerns or blockers
```

---

## Skill Mapping

| Task Type | Skill to Invoke | Sub-Agent Action |
|-----------|----------------|------------------|
| `[FE]` | `frontend-engineering` | Invoke via Skill tool |
| `[BE]` | `backend-engineering` | Invoke via Skill tool |
| `[FS]` | Both FE + BE | Invoke both via Skill tool |
| `[CONFIG]` | None | Proceed directly |
| `[DB]` | None | Use Supabase MCP tools |
| `[BLOCKED]` | N/A | Skip, report to user |

---

## Failure Handling

| Situation | Action |
|-----------|--------|
| Sub-agent fails a task | Log failure, continue with other tasks in phase, report at end |
| Git conflict between sub-agents | Re-run the conflicting task on top of resolved state |
| Build/lint/tests fail after phase | Dispatch fix sub-agent with error output |
| `[BLOCKED]` task | Skip, report to user |
| Task unclear | Include in sub-agent prompt; sub-agent will ask questions |
| Task too large | Report to user, suggest breaking it down |

---

## Example Execution

```
User: Execute SPRINT-17

Orchestrator:
1. Reads SPRINT-17.md
2. Finds 4 phases: A (3 tasks), B (3 tasks), C (4 tasks), D (2 tasks)
3. Creates TodoWrite with 12 tasks

Phase A: Infrastructure
  → Dispatches 3 sub-agents in parallel:
    - Sub-agent 1: [FE] Spotlight component
    - Sub-agent 2: [FE] data-tutorial-id attributes
    - Sub-agent 3: [FE] Tutorial store
  → All 3 complete
  → Runs pnpm build && pnpm lint && pnpm test → ✅
  → Marks 3 tasks complete

Phase B: AI Integration
  → Dispatches 3 sub-agents in parallel:
    - Sub-agent 4: [BE] show_tutorial tool
    - Sub-agent 5: [BE] Intent mapping
    - Sub-agent 6: [BE] Parse queries
  → All 3 complete
  → Verification → ✅
  → Marks 3 tasks complete

Phase C: Tutorial Content
  → Dispatches 4 sub-agents in parallel:
    - Sub-agent 7: [CONFIG] Tutorial sequences JSON
    - Sub-agent 8: [FE] Add expense tutorial
    - Sub-agent 9: [FE] Manage categories tutorial
    - Sub-agent 10: [FE] Credit card tutorial
  → All 4 complete
  → Verification → ✅

Phase D: Polish
  → Dispatches 2 sub-agents in parallel
  → Verification → ✅

Report:
  ✅ 12/12 tasks complete
  Sprint 17 finished.
```

---

## Context Management

**Why sub-agents?**
- Each sub-agent gets a **fresh context window** — no pollution from previous tasks
- The orchestrator's context stays lean (only manages dispatch + verification)
- Parallel execution within phases saves wall-clock time

**Orchestrator rules:**
- Do NOT read implementation files yourself — that's the sub-agent's job
- Do NOT carry code context between phases
- Only read: sprint file, verification output, sub-agent reports
