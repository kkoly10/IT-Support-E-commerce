# Kocre IT

Kocre IT is being built as a **human-supervised, AI-native managed service provider (MSP)** for small businesses.

The business model is simple: Kocre should take increasing responsibility for a customer's everyday IT environment while keeping the control plane, automation, customer experience and ordinary IT operations in-house. Specialist services that depend on large 24/7 expert teams or independent attestations are integrated through partners rather than rebuilt from scratch.

## North Star

The target operating loop is:

> **Customer ticket or monitoring event → AI triage → verified client/device context → diagnosis → supervised runbook → execution → independent verification → ticket/customer update → human escalation when needed.**

The goal is not to remove people from support. The goal is to let a human technician supervise many more environments because routine diagnosis, remediation, verification and documentation are handled by AI through Personal Commands.

## Commercial service ladder

New customer pricing and exact scope live in the versioned service catalog; existing customers retain accepted terms until a new agreement is approved.

| Service | Current public pilot | Responsibility |
| --- | --- | --- |
| **One-Time IT Help** | $125/session | One eligible remote issue, up to 60 minutes |
| **Remote Desk** | $149/month first supported person + $49/additional; $199 setup | Helpdesk, Microsoft 365 / Google Workspace basic administration, software support and routine onboarding/offboarding |
| **Managed Desk** | $229/month first person + $99/additional; $499 setup | Remote Desk plus proactive care for one approved Windows computer per supported person |
| **Secure Desk** | $299/month first person + $129/additional; $699 setup | Managed Desk plus managed endpoint security, security-baseline work and agreed recovery oversight |
| **Cloud Care** | From $99/month per eligible small workload + provider usage | DigitalOcean/cloud administration, monitoring, backups, DNS/SSL and routine infrastructure operations |
| **Custom / Enterprise** | Written quote | Larger teams, complex environments, servers, advanced cloud/security, compliance or special coverage |

Public arithmetic is intentionally limited to **1–2 supported people**. Three or more supported people require a written quote after workload, devices, security, cloud and compliance needs are reviewed.

Third-party licenses, endpoint-security subscriptions, backup storage, cloud-provider usage, hardware, migrations, new-computer builds, rebrands and large restoration projects are separate unless a signed quote explicitly includes them.

## What Kocre should own

- Customer portal, service state and ticket workflow.
- Helpdesk and ordinary IT administration.
- Endpoint inventory, telemetry and remote control.
- Windows/Mac command execution and remediation through Personal Commands.
- Mesh-backed remote sessions.
- Patch/update orchestration and health checks.
- Runbooks, verification and activity evidence.
- DigitalOcean/cloud administration.
- AI triage, diagnosis and supervised remediation.
- Customer-visible reporting and lifecycle operations.

## What Kocre should partner for

- **24/7 human SOC / MDR** and global threat research.
- Specialized EDR/ITDR/SIEM detection engines when economically sensible.
- Backup infrastructure/storage products where appropriate.
- GRC/compliance automation platforms.
- Independent SOC 2 auditors, C3PAOs and other required assessors.
- After-hours human NOC/help desk only when customer volume justifies it.

The architectural rule is:

> **Own what differentiates Kocre. Rent specialized expertise that is expensive or inappropriate to recreate internally.**

## AI-native platform strategy

Personal Commands is the long-term Kocre control plane. Its job is to evolve from powerful remote computer control into fleet-grade MSP automation:

1. Model clients, sites, users, devices, cloud workloads and service entitlements.
2. Continuously ingest endpoint/cloud telemetry.
3. Turn telemetry into actionable events rather than noisy raw alerts.
4. Execute deterministic runbooks with exact customer/device binding.
5. Connect tickets and alerts to AI diagnosis.
6. Let AI perform routine remediation under human supervision.
7. Independently verify every material result.
8. Write outcomes back to tickets and the client portal.
9. Escalate novel, consequential or low-confidence cases to humans.
10. Integrate SOC, backup and compliance partners into the same workflow.

## Current product state

The repository already contains meaningful reusable foundations: authentication, organizations/workspaces, contacts, onboarding, agreements, documents, access requests, tickets, service requests, settings and monitoring-related components.

The major unfinished MSP areas are the activated-client dashboard, device/provider execution inside the portal, fleet telemetry, service entitlements, billing actions, customer reporting, backup-provider wiring, security-provider incident flow and the full ticket → AI → remediation → verification loop.

Do not confuse an existing page with a finished service. The product should represent every feature as one of:

- **Ready and usable**
- **Included but setup required**
- **Kocre is working on it**
- **Available on another plan**
- **Provider/stale/error state with a truthful explanation**
- **Historical record after service ends**

## Temporary RMM bridge

Tactical RMM may be used tactically while Personal Commands grows into the long-term RMM/NOC layer. Its purpose would be to provide commodity monitoring, patching, inventory and alerting sooner—not to replace Personal Commands as the AI/control architecture.

Avoid unnecessary duplicate agents or overlapping remote-control ownership. If Tactical RMM is activated, deliberately choose whether it should run without its Mesh component or integrate with the existing Mesh architecture.

## Product discipline

Every major feature should answer at least one of these questions:

- Does this help Kocre observe a client environment?
- Does it help diagnose a problem?
- Does it let Kocre safely remediate something?
- Does it verify the outcome?
- Does it improve human supervision or escalation?
- Does it give the customer truthful visibility?
- Does it reduce technician labor per managed endpoint?
- Does it make the AI-native MSP loop more complete?

If the answer is no, it is probably not a priority.
