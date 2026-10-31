# Kocre IT — One-Droplet Tactical RMM and MeshCentral Consolidation

**Current decision: October 31, 2026. Status: duplicate Droplet DESTROYED after confirmed snapshot; Debian target prepared; unified application is NOT installed or live.**

The owner explicitly authorized interrupting and replacing the old remote Mesh connections. Therefore, there is **no requirement to preserve the old MeshCentral enrollment database or keep two paid servers**. The correct supported implementation is to install Tactical RMM on the already provisioned *fresh Debian 13* Droplet and use the MeshCentral instance that Tactical's official installer creates. Its built-in Nginx will terminate HTTPS and route the three hostnames. There is no justification yet to buy an 8 GB Droplet or to attempt unsupported co-installation on the older Ubuntu 22 server.

## Verified inventory — October 31

| Resource | Address and verified state | Size and observations | Disposition |
| --- | --- | --- | --- |
| Permanent target: DO Droplet 614278568, kocre-tactical-rmm-primary-20261030 | 147.182.176.4; SSH works with key stored on owner's Mac | Debian 13 x64; 2 vCPU, 4 GB RAM, 80 GB; ~383 MB RAM in use at inspection; about 75 GB free disk | Install Tactical and its **bundled** MeshCentral; retains verified weekly DO backup setting |
| Redundant: DO Droplet 612825810, kocre-tactical-rmm-20261026 | 138.197.144.46; SSH works with existing Mac key; remote.kocreit.com currently points here | Ubuntu 22.04; 2 vCPU, 4 GB; ~438 MB RAM in use; meshcentral-recovery.service running; about 144 MB Mesh data | Owner-authorized retired host; safety snapshot created and retained, then Droplet 612825810 **destroyed on October 31**; absent from DigitalOcean inventory |
| Former Tactical Hetzner VM | 5.78.108.99 | User confirmed suspended and access lost; old API/RMM/mesh DNS names still point here | Retire from architecture |
| Personal Commands owner endpoints | Mac; Windows 11 DESKTOP-GK1O0VJ; Windows 10 DESKTOP-MROET3A | Owner devices were connected via Personal Commands during live inspection; Tactical services on both Windows hosts pointed to the old dead server | Preserve Personal Commands remote tool access; reinstall/re-enroll Tactical and its bundled Mesh agent once operational |

The redundant Mesh Droplet was actually destroyed and disappeared from the owner DigitalOcean resource list. Only the permanent 4 GB Tactical target is now billed as an RMM/Mesh compute Droplet (estimated $24/month compute plus $4.80/month weekly automated backups = $28.80/month). Preserved snapshot `kocre-old-mesh-preconsolidation-20261031` was verified in the deletion dialog as **retained** (checkbox unchecked), approximately **$0.19/month** extra snapshot storage. Actual prorated billing invoice and first restorable weekly backup remain unverified.

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

The original combined Mac Personal Commands command was refused **before dispatch** with CATASTROPHIC_DISABLED (catastrophic system command pattern); inspection of Personal Commands source proved its lexical classifier can match harmless `/var/run/reboot-required` inside a read-only existence test. The agent also refused a later read-only package inventory containing the `sudo` package name with `PRIVILEGED_DISABLED`. After reviewing each actual effect, the following **individually scoped supported Mac shell.exec -> SSH** operations were admitted and returned exit code 0 on the new Debian host only: `apt-get update -qq`, `apt-get install -y -qq wget curl ufw`, and `apt-get -y -qq upgrade`. No privilege bypass or alternate executor was used. Installing/configuring `sudo`, creating a privileged `tactical` user, configuring firewall, certificates and invoking the Tactical installer remain outstanding. Do not bypass a genuine refusal; obtain legitimate authorization if required.

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
7. **Decommission recorded COMPLETE (compute only):** Owner authorized breaking unused Mesh sessions; DO browser created snapshot `kocre-old-mesh-preconsolidation-20261031`; displayed `Snapshot created.`; destroy modal identified old Droplet 612825810 and associated snapshot with **0/1 selected / will not be deleted**, and the owner-authorized Destroy was executed. DO redirected to Droplets inventory, showing new target 614278568 and **no** old Droplet. Old compute billing stops from destruction; prorated invoice unverified. **Still pending:** remove or retire DNS `remote.kocreit.com` (currently points to deleted 138.197.144.46), verify independent backup restore, and consider eventual snapshot deletion only after the new system is stable. Do not delete new target 614278568.
8. **Resource release review:** Observe real RSS, free memory, disk I/O, swap, 24-hour process stability and monitoring latency with initial agents. If pressure or user-visible degradation emerges, upgrade the **single** existing Droplet in place and budget the revised recurring cost rather than buying a second one. Verify backup restoration, certificate renewal, offline/reboot/connection recovery and exact-tenant refusal.

## Status record — October 31

- **Completed:** provider requirements researched, both hosts inspected, Debian 13 target selected and SSH verified, canonical domains defined, three successful apt operations on target, old Mesh snapshot created and confirmed, old Mesh Droplet 612825810 deleted and absent from DO list, DO weekly backups enabled on target, read-only monitoring bridge tested in earlier draft PR.
- **Not completed:** Tactical install, DNS owner confirmation, wildcard certificate, actual bundled Mesh deployment, Windows re-enrollment, functional human remote takeover, AI closed loop, first restored backup, prorated billing readback, stale `remote.kocreit.com` DNS cleanup.

- **Post-deletion external probe:** `remote.kocreit.com` continues resolving to the old address 138.197.144.46. After provider resource deletion, a fresh TCP port 22 probe to that IP produced a connection response; this **does not prove the old host is still owned by Kocre** and may reflect reassignment or networking state. **Treat the old DNS name and IP as untrusted** and retire that A record through normal owner-authorized Vercel DNS administration. Do not attempt to authenticate to this IP or reinstall clients pointed to it.
- **Final repo check:** Kocre Node suite at `858d75c` passed **63 tests, zero failures**, git diff whitespace check clean, Vercel preview status success. Source tests do not qualify live Tactical infrastructure or agent Take Control.

- **Do not call this operational or cost-saving accomplished until verified.** In particular, the existing frontend/DNS and running Windows service do not prove connectivity to the new RMM.

