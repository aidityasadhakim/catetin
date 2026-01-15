# Daily Work Session

## Objective

Keep looping until there is no more issues on beads
Complete one beads issue per session with full quality gates. The working director is on ../*

## Workflow

1. Find work: Run bd ready
to pick 1 workable issue (check for context)
2. Claim it: bd update <id› --status in_progress
3. Implement: Complete the work with tests
4. Verify:
- Backend: build golang
- Frontend: build using bun
5. Land the plane: Close issue, commit, push to remote ## Logging
Append one-liner to /docs/LOG.md: = YYYY-MM-DD - HH:mm: ss: <issue-id> - <brief description›
