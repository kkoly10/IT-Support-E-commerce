# Kocre IT — One-Droplet Tactical RMM and MeshCentral Consolidation

**Current decision: October 31, 2026. Status: planned and infrastructure verified; the unified application is NOT yet installed or live.**

The owner explicitly authorized interrupting and replacing the old remote Mesh connections. Therefore, there is **no requirement to preserve the old MeshCentral enrollment database or keep two paid servers**. The correct supported implementation is to install Tactical RMM on the already provisioned *fresh Debian 13* Droplet and use the MeshCentral instance that Tactical's official installer creates. Its built-in Nginx will terminate HTTPS and route the three hostnames. There is no justification yet to buy an 8 GB Droplet or to attempt unsupported co-installation on the older Ubuntu 22 server.

## Verified inventory — October 31

| Resource | Address and verified state | Size and observations | Disposition |
| --- | --- | --- | --- |
| Permanent target: DO Droplet 614278568, kocre-tactical-rmm-primary-20261030 | 147.182.176.4; SSH works with key stored on owner's Mac | Debian 13 x64; 2 vCPU, 4 GB RAM, 80 GB; ~383 MB RAM in use at inspection; about 75 GB free disk | Install Tactical and its **bundled** MeshCentral; retains verified weekly DO backup setting |
| Redundant: DO Droplet 612825810, kocre-tactical-rmm-20261026 | 138.197.144.46; SSH works with existing Mac key; remote.kocreit.com currently points here | Ubuntu 22.04; 2 vCPU, 4 GB; ~438 MB RAM in use; meshcentral-recovery.service running; about 144 MB Mesh data | No migration of sessions required; capture a snapshot or restorable backup if feasible, then **destroy the Droplet** only after release checks |
| Former Tactical Hetzner VM | 5.78.108.99 | User confirmed suspended and access lost; old API/RMM/mesh DNS names still point here | Retire from architecture |
| Personal Commands owner endpoints | Mac; Windows 11 DESKTOP-GK1O0VJ; Windows 10 DESKTOP-MROET3A | Owner devices were connected via Personal Commands during live inspection; Tactical services on both Windows hosts pointed to the old dead server | Preserve Personal Commands remote tool access; reinstall/re-enroll Tactical and its bundled Mesh agent once operational |

DigitalOcean currently charges for **both** Droplets until the redundant Droplet is actually deleted. The permanent target is estimated at **$24/mo compute plus $4.80/mo weekly backups = $28.80/mo**. The redundant Mesh host is approximately **$24/mo extra**. A snapshot may have separate storage charges. These estimates are not evidence of an actual billing adjustment.

Tactical's official requirements: clean Debian 13 or Ubuntu 26.04 VM with at least 4 GB RAM; the traditional installer assumes no other application is installed. It automatically installs MeshCentral and developers recommend using that bundled instance. 4 GB is the tested minimum, not a proven scaling capacity. Re-evaluate after real deployment and load measurements.

## Canonical end state

- Frontend: rmm.kocreit.com -> 147.182.176.4.
- Backend/agents: api-rmm.kocreit.com -> 147.182.176.4.
- Unified Mesh: mesh.kocreit.com -> 147.182.176.4, **the MeshCentral managed by Tactical RMM**.
- remote.kocreit.com currently targets the redundant old Mesh host. Retire/remove this DNS record after the old host is deleted, or explicitly configure and validate it as a supported HTTPS alias in a later independent change. **Do not simply repoint it to the new server:** the Tactical-installed TLS certificate and Nginx config might not cover that hostname.
- Kocre's AI Technician remains an independently hosted long-running worker; its privileged tool control belongs to Personal Commands, not to the customer-facing Atlas interface. Tactical provides inventory, monitoring and patch alerts; the built-in Mesh supports human takeover, with Personal Commands usage requiring verified integration and enrollment.
- All newly enrolled owner/client Windows machines receive the Tactical agent **with its Mesh feature enabled** (not the -nomesh option). Do not install both an independent recovery Mesh agent and Tactical's bundled Mesh agent without examining the resulting services and device identities.
- New customer enrollments require verified tenant identity, approval/entitlement, a real session and ticket audit, and independent outcome verification. A database remote_sessions row alone does not mean desktop control worked.

## DNS and installation gates

The three A records are still pointing at 5.78.108.99 (confirmed October 31). Vercel authoritative DNS team: komlan-kouhikos-projects, team_A3Dv2lg1siA9CtVB7BKdhkOi.

| Host label | Existing record ID | Required value |
| --- | --- | --- |
| rmm | rec_40ab01c018c360d00ea889eb | 147.182.176.4 |
| api-rmm | rec_5f87d01e47b76ee75b041fd3 | 147.182.176.4 |
| mesh | rec_8f385a5a34a111866891f4b5 | 147.182.176.4 |

Last attempted Vercel connector update returned HTTP 403 forbidden. The owner's authenticated Vercel CLI returned action_required / interactive_confirmation_required for a live DNS record replacement. It requires the user to execute and confirm in their own interactive terminal (or update the records in the Vercel UI). **Do not bypass that owner confirmation by switching tools.** Commands requiring operator confirmation:

    vercel dns update rec_40ab01c018c360d00ea889eb --value 147.182.176.4 --scope komlan-kouhikos-projects
    vercel dns update rec_5f87d01e47b76ee75b041fd3 --value 147.182.176.4 --scope komlan-kouhikos-projects
    vercel dns update rec_8f385a5a34a111866891f4b5 --value 147.182.176.4 --scope komlan-kouhikos-projects

Do not change Kocre's apex/website, MX/email, or existing remote.kocreit.com records as part of those three replacements. The official installer will prompt for a temporary Let's Encrypt wildcard TXT challenge at _acme-challenge.kocreit.com. Its value is not known until the installation requests it.

Earlier remote server preparation via Personal Commands Mac shell.exec was refused **before dispatch** with CATASTROPHIC_DISABLED (catastrophic system command pattern). A current Full Control policy and user consent do not mean this particular command was admitted. Do not use an alternate execution surface to evade that denial. Resolve the authorized maintenance route and confirm accepted command scope before applying OS updates or the install script.

When the legitimate maintenance route is available, follow the official documented traditional Debian 13 installation sequence: update and upgrade the OS, install wget/curl/sudo/ufw; create the tactical sudo user with a unique password; verify SSH recovery then restrict/firewall ports 22 and 443; switch to the tactical user and execute the reviewed official amidaware/tacticalrmm master install.sh. Let the installer create MeshCentral, Postgres, NATS, Nginx and certificates. Complete the wildcard TXT challenge using a trusted certificate; **never use --insecure in production**, as it disables TLS verification and requires future agent reinstallation to convert. Keep interactive TOTP credentials outside chat/logs and verify the dashboard after enrollment.

Official documentation:
- https://docs.tacticalrmm.com/install_server/
- https://docs.tacticalrmm.com/install_considerations/
- https://docs.tacticalrmm.com/mesh_integration/
- https://docs.tacticalrmm.com/license/

## Order of work and acceptance

1. **Infrastructure preflight:** New target must stay clean Debian 13, with SSH, 4 GB RAM, free disk and correct installed key. Confirm scheduled backups. Do not run install on the old Ubuntu 22 host.
2. **DNS owner action:** Update the three A records; verify from an external resolver. Complete the interactive Let's Encrypt TXT challenge only when prompted.
3. **Install without conflict:** Use documented Tactical traditional installer and bundled MeshCentral on the target. No independent Nginx/second proxy/Mesh service. Keep 22 accessible to owner, agent HTTPS 443 available and valid certificates.
4. **Verification:** Confirm Tactical frontend, Django API, HTTPS/Mesh, NATS, database health, administrator 2FA and a real read-only API identity. Test restart and backend service recovery.
5. **Owner endpoint QA:** Re-enroll the two Windows test PCs with new Tactical/Mesh identities. Remove the stale Tactical and old Mesh agents if required by documented uninstall/enrollment procedure, *only on owner-owned devices*. Verify check-ins, live diagnostics, and a real manual Take Control session. Check Personal Commands native access separately.
6. **AI Technician loop:** Verify the Kocre internal bounded read-only Tactical adapter with fresh agent IDs and tenant bindings. A real alert or ticket must map to the exact entitlement and device; a Personal Commands runbook (on a test machine) must complete and be independently verified; no direct privileged Atlas access.
7. **Decommission the duplicate:** Given the owner's permission to break old sessions, a verified snapshot/backup is preferable but not a required enrollment migration. When replacement management/takeover has been verified, destroy **only** DO Droplet 612825810 at 138.197.144.46, confirm it is gone in DigitalOcean and billing, then retire remote.kocreit.com. Do **not** delete DO Droplet 614278568 at 147.182.176.4. Stopping a Droplet does not eliminate its compute bill.
8. **Resource release review:** Observe real RSS, free memory, disk I/O, swap, 24-hour process stability and monitoring latency with initial agents. If pressure or user-visible degradation emerges, upgrade the **single** existing Droplet in place and budget the revised recurring cost rather than buying a second one. Verify backup restoration, certificate renewal, offline/reboot/connection recovery and exact-tenant refusal.

## Status record — October 31

- **Completed:** authoritative provider requirements researched, both current hosts inspected, target selected, canonical domains defined, owner has authorized dropping old Mesh sessions, conservative single-server cost established, Kocre monitoring bridge draft PR tests previously passed.
- **Not completed:** Tactical install, DNS owner confirmation, wildcard certificate, actual bundled Mesh deployment, Windows re-enrollment, functional human remote takeover, AI closed loop, old Droplet deletion and billing readback.
- **Do not call this operational or cost-saving accomplished until verified.** In particular, the existing frontend/DNS and running Windows service do not prove connectivity to the new RMM.

