# Kocre IT — AI-Native MSP Primary Vision

**This document is the primary architecture for Kocre IT.** Product, portal, Personal Commands, monitoring, automation and partner integrations should be judged against this design. If another roadmap conflicts with this document, preserve the underlying evidence but treat this vision as the product direction unless the owner explicitly changes it.

## One target operating mode

Kocre is not being built as a conventional MSP that occasionally uses an AI chat tool.

The target from the beginning is **one human-supervised, full closed-loop AI Technician**:

> **Ticket or monitoring event → verified customer/device context → AI diagnosis → runbook/tool selection → endpoint/cloud action → independent verification → ticket/activity writeback → human supervision or escalation when needed.**

There are **no product stages of autonomy** such as “advice-only,” “one-click AI,” and “autonomous AI” as separate architectural destinations. Development and testing may isolate components, but every component must be designed to fit the final closed loop from day one.

Human supervision is permanent and intentional. Humans handle exceptions, novel/high-impact work, customer relationships, low-confidence decisions and takeover when needed. Human supervision does not mean a human must manually initiate every routine task.

## The architecture

```text
Customer / employee
        │
        ▼
Kocre Portal
├── Atlas AI — customer-facing copilot
├── Tickets
├── Devices
├── Service / billing state
└── Activity, approvals and reports
        │
        ▼
Kocre Event + Job Layer
        │
        ▼
Kocre AI Technician
├── model/reasoning
├── customer + service-entitlement context
├── device/cloud telemetry
├── diagnosis
├── runbook/tool selection
├── execution policy
├── verification
└── escalation / human handoff
        │
        ▼
Personal Commands Cloud Control Plane
        │
        ├──────────────► DigitalOcean / cloud workloads
        │
        ▼
Kocre Endpoint Agent
(Personal Commands on each managed computer)
├── system / app / process inspection
├── PowerShell / shell execution
├── filesystem and configuration work
├── patch / maintenance actions
├── local verification
└── Mesh-backed interactive remote control
        │
        ▼
Customer computer
```

External specialist systems such as MDR/SOC, backup and compliance platforms feed incidents/status into the same event layer rather than becoming separate technician workflows.

## Component responsibilities

### Atlas AI — customer-facing intelligence

Atlas is the customer-facing assistant inside the Kocre portal. It can explain services, answer account/ticket questions, gather problem descriptions, show status and communicate verified outcomes.

Atlas is **not** the privileged endpoint execution service. It should never be given unrestricted computer authority merely because it is visible to the customer.

### Kocre AI Technician — the brain

The AI Technician is a privileged backend service running in Kocre-controlled cloud infrastructure. It does not depend on a browser tab being open and does not depend on ChatGPT being installed on a client computer.

It wakes because an event exists: a ticket, telemetry alert, security incident, onboarding task, failed patch, stale backup, device outage or another supported trigger.

Its responsibilities are to:

1. Bind the event to the exact organization, user, device, workload and service entitlement.
2. Gather fresh evidence before acting.
3. Diagnose using the ticket/event plus verified telemetry.
4. Select deterministic runbooks or bounded tools.
5. Act through Personal Commands and other approved provider integrations.
6. Independently verify the result rather than trusting a submitted command.
7. Write the outcome to Kocre's ticket/activity record.
8. Continue, retry within defined bounds, or escalate to a human based on evidence and policy.

### Personal Commands — the control plane and endpoint nervous system

Personal Commands is the long-term technical control plane. It supplies the tools, secure routing, endpoint identity, remote execution, telemetry and verification primitives used by the AI Technician.

ChatGPT is a current operator/development client of Personal Commands. **ChatGPT is not the future production brain.**

### Kocre Endpoint Agent

Every managed customer computer should install a branded **Kocre Agent**, implemented from the Personal Commands endpoint runtime.

The customer should not install ChatGPT.

The endpoint package ultimately provides:

- secure device enrollment into the correct Kocre organization;
- persistent Personal Commands connectivity;
- device identity and service-entitlement binding;
- health/inventory/telemetry collection;
- exact-device command and remediation execution;
- verification results;
- Mesh-backed interactive remote access;
- temporary Tactical RMM integration while Tactical supplies commodity monitoring/patching that Personal Commands has not yet replaced.

### Tactical RMM — temporary bridge, not the brain

Tactical RMM may provide monitoring, inventory, patching and alerting while Personal Commands grows fleet-grade equivalents. Prefer a configuration that avoids duplicate Mesh ownership.

Tactical may detect **what happened**. The Kocre AI Technician decides **what it means and what to do**, and Personal Commands performs and verifies the work.

### DigitalOcean — long-running operations

DigitalOcean is the preferred home for long-running AI Technician workers, event processing, telemetry ingestion, schedules and other workloads that should not depend on a short web request.

The Kocre portal may remain on Vercel while the autonomous operating layer runs independently.

## Multi-tenant requirement

Personal Commands began as one owner controlling their own computers. The MSP version must make the following hierarchy first-class:

```text
Kocre
└── Organization
    ├── Sites
    ├── Users
    ├── Devices
    ├── Cloud workloads
    └── Service entitlements
```

Every action must be bound to the exact tenant and target. The AI Technician must know what the client purchased, what device/workload it is acting on, what evidence triggered the work, what it changed and how the result was verified.

## Build vs partner

Kocre should own the pieces that create differentiation and operating leverage:

- customer portal and ticket workflow;
- endpoint/cloud control plane;
- telemetry and event normalization;
- runbooks and remediation;
- AI diagnosis/orchestration;
- verification and activity evidence;
- customer-visible reporting;
- DigitalOcean/cloud administration;
- ordinary IT operations.

Kocre should partner where recreating the capability would be economically irrational or conflict with independent-assessor requirements:

- 24/7 human SOC / MDR and threat research;
- specialized EDR/ITDR/SIEM engines when appropriate;
- backup infrastructure/storage products where appropriate;
- GRC/compliance platforms;
- independent auditors / assessors;
- after-hours human NOC/help desk when customer scale justifies it.

**Rule: own the control plane; rent specialized expertise.**

## Reliability doctrine

The target is the highest operating mode from the beginning, but it is not declared reliable by design intent.

Reliability must be earned through repeated adversarial qualification:

- exact tenant/device binding;
- fresh pre-action evidence;
- deterministic or bounded runbooks;
- independent postcondition verification;
- idempotency and replay protection;
- timeout/interruption recovery;
- wrong-target refusal;
- stale-state handling;
- customer/service-entitlement checks;
- human takeover and escalation;
- full activity evidence;
- repeated real-device testing across Windows, Mac, cloud workloads, network failure and reboot/reconnect conditions.

Do not count tool registration, unit tests or a command exit code as proof that the AI Technician completed the customer's outcome.

## Definition of success

Kocre becomes genuinely AI-native when a routine support ticket or monitoring event can be handled without the owner manually starting a chat:

> **The system notices or receives the work, the AI Technician investigates, Personal Commands acts on the exact managed environment, the result is independently verified, the ticket/customer record is updated, and a human is pulled in only when supervision or escalation is actually required.**

That is the primary product vision.
