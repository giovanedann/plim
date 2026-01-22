---
name: sprint-executor
description: Use when user says "Execute SPRINT-XX" - iterates through sprint tasks autonomously with context management
---

# Sprint Executor

Executes sprint files autonomously, managing context between tasks to prevent overflow.

## Execution Protocol

### 1. Parse Sprint File

Read the sprint file and identify:
- All uncompleted tasks (`- [ ]`)
- Task types: `[FE]`, `[BE]`, `[FS]`, `[CONFIG]`, `[BLOCKED]`
- Task context and acceptance criteria

### 2. For Each Uncompleted Task

**A. Skill Invocation (MANDATORY)**

| Task Type | Action |
|-----------|--------|
| `[FE]` | Invoke `frontend-engineering` skill |
| `[BE]` | Invoke `backend-engineering` skill |
| `[FS]` | Invoke BOTH `frontend-engineering` AND `backend-engineering` |
| `[CONFIG]` | No skill needed |
| `[BLOCKED]` | STOP and report blocker to user |

**B. Execute the Task**

1. Read ONLY the files needed for THIS task (minimize context)
2. Implement according to acceptance criteria
3. Run relevant checks (build, lint, type-check)
4. Ask user for feedback. DO NOT PROCEED WITHOUT FEEDBACK.
5. Commit changes if code was written

**C. Mark Complete**

1. Edit the sprint file: change `- [ ]` to `- [x]`
2. Output: "TASK COMPLETE: [brief summary]"

**D. Context Reset**

Before moving to next task:
- DO NOT reference code from previous tasks
- DO NOT keep file contents in memory
- Each task starts fresh - read files anew if needed

### 3. Completion

When all tasks are done (or blocked):
1. Update the Completion Summary table in the sprint file
2. Report final status to user, and ask for feedback

## Context Management Rules

**WHY:** Long sprints can exhaust context window. Each task must be self-contained.

**HOW:**
- Treat each task as a mini-session
- Re-read files even if you "remember" them
- Don't explain previous tasks when starting a new one
- Keep task summaries to 1-2 sentences max

## Example Execution Flow

```
User: Execute SPRINT-01

Claude:
1. Reads SPRINT-01.md
2. Finds first uncompleted task: `[FE]` Add loading spinner
3. Invokes frontend-engineering skill
4. Reads only the component file needed
5. Implements the spinner
6. Runs `pnpm build`
7. Marks task complete in sprint file
8. Outputs: "TASK COMPLETE: Added loading spinner to ExpenseList"
9. Moves to next task (fresh context)
```

## Handling Issues

| Situation | Action |
|-----------|--------|
| Task unclear | Ask user for clarification, pause sprint |
| Build fails | Fix the issue, don't skip the task |
| Task too large | Suggest breaking it down, pause sprint |
| `[BLOCKED]` task | Report blocker, skip to next non-blocked task |
