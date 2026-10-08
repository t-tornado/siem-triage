# M11 Task — Task Queues

## Context

SIEM triage system routes alerts by severity. Critical alerts need dedicated workers with
response-time guarantees. Enrichment is shared and rate-limited. Standard alerts share a
separate pool.

## Task

Scaffold the task queue architecture for the SIEM triage project.

### 1. Queue constants

Define all queue names in one constants file (shared across packages — put in `activities`
or a `common` package). No magic strings anywhere else.

Queues needed:
- `siem-critical-triage`
- `siem-standard-triage`
- `siem-enrichment`

### 2. Worker stubs

Create a stub worker per queue. Each is a runnable Node.js script. No activities registered
yet — just `Worker.create()` with the correct `taskQueue` and a log confirming it started.

```
workers/
  critical/src/index.ts
  standard/src/index.ts
  enrichment/src/index.ts
```

### 3. Workflow routing stub

Define one stub workflow: `triageAlertWorkflow(alert: { severity: 'CRITICAL' | 'STANDARD' })`.

Inside, use `proxyActivities` with a `taskQueue` override based on severity:
- `CRITICAL` → `siem-critical-triage`
- `STANDARD` → `siem-standard-triage`

Activity itself can be a stub (just returns `{ routed: true }`). Goal is proving the routing
logic, not the activity implementation.

### 4. Prove it

Run all three workers. Start two workflow executions — one CRITICAL, one STANDARD.

Open Temporal UI. Show:
- CRITICAL workflow scheduled task on `siem-critical-triage`
- STANDARD workflow scheduled task on `siem-standard-triage`
- `siem-enrichment` queue has a running worker (no tasks yet — that is fine)

## Done when

- [ ] Queue constants defined, no magic strings
- [ ] Three worker stubs running and polling their queues
- [ ] Workflow routes to correct queue based on severity
- [ ] Temporal UI confirms correct queue assignment per severity
