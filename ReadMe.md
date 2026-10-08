# SIEM Alert Triage & On-Call Escalation System

A production-grade alert response system built on Temporal. Receives security alerts from a SIEM, enriches and scores them, executes severity-based response workflows, and escalates through an on-call chain until acknowledged.

Inspired by how PagerDuty + SOAR platforms work internally — rebuilt from first principles using durable execution.

---

## The Problem

A SIEM fires thousands of alerts per day. Without automation:
- Analysts manually triage every alert — impossible at scale
- Critical alerts get missed or delayed
- No audit trail of who responded, when, and what they did
- On-call escalation is manual, inconsistent, and unreliable

A server crash mid-response loses all state. No retry. No audit. Alert falls through the cracks.

## The Solution

Temporal-orchestrated response pipeline. Every alert becomes a durable workflow:
- Survives server restarts
- Retries failed enrichment calls
- Waits for human acknowledgment — durably, without polling
- Escalates automatically on timeout
- Full audit trail in event history

---

## System Architecture

```
SIEM (mock alert generator)
        │
        ▼
  HTTP API (Fastify)          ← POST /alerts
        │
        ▼
  Temporal Client             ← starts AlertTriageWorkflow per alert
        │
        ▼
  Temporal Server             ← manages event history, task queues
        │
   ┌────┴────┐
   ▼         ▼
Worker    Worker              ← horizontal scaling demo
   │
   ├── enrichIp activity         (mock VirusTotal)
   ├── enrichHash activity       (mock threat intel)
   ├── scoreAlert activity       (severity: low/medium/high/critical)
   ├── notifyChannel activity    (mock Slack/email/PagerDuty)
   ├── escalate activity         (next person in chain)
   └── closeIncident activity    (audit log + SQLite write)

        │
        ▼
  SQLite                      ← incident store
  Prometheus                  ← metrics
  Grafana                     ← dashboards
  Temporal UI                 ← workflow execution view
```

---

## Alert Lifecycle

```
Alert received (POST /alerts)
    │
    ▼
[Activity] Enrich alert
    - IP reputation lookup (mock VirusTotal)
    - Hash lookup (mock threat intel feed)
    - Duration: 2-5s simulated latency
    │
    ▼
[Activity] Score severity
    - LOW    → known benign, likely false positive
    - MEDIUM → suspicious, needs analyst review
    - HIGH   → confirmed malicious, fast response needed
    - CRITICAL → active threat, immediate response
    │
    ├── LOW      → auto-close, log reason, done
    │
    ├── MEDIUM   → notify #security-alerts channel
    │              wait for analyst ack (Signal)
    │              no ack in 30 mins → escalate to senior
    │
    ├── HIGH     → notify channel + page primary on-call
    │              wait for ack (Signal)
    │              no ack in 15 mins → escalate
    │              no ack after 3 escalations → P0 incident
    │
    └── CRITICAL → notify all channels simultaneously
                   page entire on-call chain
                   auto-isolate asset (activity)
                   open P0 incident ticket
                   wait for ack
                   no ack in 5 mins → escalate immediately
```

---

## On-Call Escalation Chain

```
Alert fires
    │
    ▼
Notify L1 on-call → wait N mins
    │ no ack
    ▼
Notify L2 senior  → wait N mins
    │ no ack
    ▼
Notify L3 manager → wait N mins
    │ no ack
    ▼
P0 incident — all hands
```

Ack received at any level → stop escalation, record responder, continue incident workflow.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Workflow engine | Temporal (local dev server) |
| HTTP API | Fastify |
| Database | SQLite (better-sqlite3) |
| Metrics | Prometheus (prom-client) |
| Dashboards | Grafana |
| Containerization | Docker Compose |
| Logging | Pino |

---

## Project Structure

```
siem-triage/
├── src/
│   ├── api/                  # Fastify HTTP server
│   │   └── server.ts         # POST /alerts, GET /incidents
│   ├── workflows/
│   │   └── alertTriage.ts    # Main triage workflow
│   ├── activities/
│   │   ├── enrichAlert.ts    # IP + hash enrichment
│   │   ├── scoreAlert.ts     # Severity scoring
│   │   ├── notifyChannel.ts  # Slack/email/PagerDuty mock
│   │   ├── escalate.ts       # On-call escalation
│   │   └── closeIncident.ts  # Audit log + SQLite write
│   ├── workers/
│   │   └── triageWorker.ts   # Worker registration
│   ├── client/
│   │   └── startWorkflow.ts  # Temporal client
│   ├── db/
│   │   └── incidentStore.ts  # SQLite repository
│   ├── mock/
│   │   └── alertGenerator.ts # Fires N fake alerts for demo
│   └── types/
│       └── types.ts
├── grafana/
│   └── provisioning/         # Auto-provisioned dashboards
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Build Phases

### Phase 1 — Core Pipeline (M11-M12)
- [ ] Project scaffold + Docker Compose
- [ ] Fastify API: `POST /alerts`
- [ ] AlertTriageWorkflow: enrich → score → respond (LOW/MEDIUM/HIGH)
- [ ] Mock enrichment activities (sleep 2-5s)
- [ ] Worker with tuned activity slots
- [ ] SQLite incident store
- [ ] Backpressure demo: flood with 50 alerts, 2 activity slots, watch queue build

### Phase 2 — Communication (M13-M16)
- [ ] Analyst acknowledgment via Signal (`ackAlert`)
- [ ] Query workflow state: `GET /incidents/:id/status`
- [ ] Update: cancel alert investigation mid-flight
- [ ] On-call escalation chain with timeout

### Phase 3 — Control Flow (M17-M21)
- [ ] Durable timers: escalation timeouts (15 min, 30 min)
- [ ] Parallel enrichment: IP + hash lookup simultaneously
- [ ] Child workflow: CRITICAL alerts spawn P0IncidentWorkflow
- [ ] Cancellation: ack received → cancel pending escalation timers

### Phase 4 — Production Hardening (M22-M29)
- [ ] Retry policies per activity (enrichment retries, notification retries)
- [ ] Timeouts: schedule-to-start for enrichment activities
- [ ] Heartbeat on long-running forensics collection
- [ ] Workflow versioning: patch escalation logic without breaking running workflows
- [ ] Worker tuning: slot sizing based on enrichment activity memory profile

### Phase 5 — Testing (M30-M32)
- [ ] TestWorkflowEnvironment: time-skip escalation timers
- [ ] Mocked activities: deterministic enrichment responses
- [ ] Replay test: catch non-determinism before production

### Phase 6 — AI Layer (M33-M38)
- [ ] LLM activity: classify alert severity from raw log context
- [ ] Agent loop: autonomous investigation agent for CRITICAL alerts
- [ ] Human-in-loop: LLM suggests response, analyst approves

---

## Metrics & Observability

### Temporal SDK Metrics (via Prometheus)
| Metric | What it shows |
|--------|--------------|
| `temporal_worker_task_slots_available` | Slot pressure — drops as alerts flood in |
| `temporal_activity_schedule_to_start_latency` | Queue backlog — rises when workers overwhelmed |
| `temporal_activity_execution_latency` | Enrichment duration per activity |
| `temporal_workflow_completed_total` | Throughput — alerts resolved per second |

### Custom Business Metrics
| Metric | What it shows |
|--------|--------------|
| `alert_severity_total` | Distribution of low/medium/high/critical |
| `alert_triage_duration_seconds` | Time from alert received to incident closed |
| `escalation_count_total` | How often alerts escalate past L1 |
| `ack_time_seconds` | How long until on-call acknowledges |

### Grafana Dashboards
- Worker health: slot availability, poll rate, queue depth
- Alert pipeline: throughput, severity breakdown, triage latency
- Escalation: ack time distribution, escalation rate

---

## Demo Scenario

**Setup:**
- Worker with `maxConcurrentActivityTaskExecutions: 2`
- Each enrichment activity sleeps 5 seconds

**Run:**
```bash
# Terminal 1 — worker
npm run worker

# Terminal 2 — fire 50 alerts
npm run demo:flood

# Terminal 3 — watch metrics
open http://localhost:3001  # Grafana

# Terminal 4 — Temporal UI
open http://localhost:8080
```

**What you see:**
1. 50 workflows start simultaneously in Temporal UI
2. Slots fill to 2 → remaining 48 queue on server
3. `temporal_worker_task_slots_available` drops to 0
4. `temporal_activity_schedule_to_start_latency` climbs
5. Start second worker terminal → queue drains fast
6. Metrics recover

---

## Status

> Phase 1 in progress. Modules M11-M12 in progress.
