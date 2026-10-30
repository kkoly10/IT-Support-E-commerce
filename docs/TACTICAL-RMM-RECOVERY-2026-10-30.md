# Tactical RMM recovery and internal bridge — 2026-10-30

## Release status: NOT reactivated

Personal Commands reached all three owner computers during this inspection: MacBook Air, DESKTOP-GK1O0VJ (Windows 11), and DESKTOP-MROET3A (Windows 10). Both Windows computers have a running tacticalrmm service; Windows 11 also has a running Mesh Agent service. Windows 10 has a separately downloaded Kocre recovery/Mesh package. A running service does not establish server connectivity or active remote control. An independent Personal Commands Mesh recovery inspection on Windows 10 returned MESH_RECOVERY_NOT_CONFIGURED, so remote fallback is not being claimed as functional.

At the time of inspection, DNS for rmm.kocreit.com, api-rmm.kocreit.com, and mesh.kocreit.com resolved to 5.78.108.99 (former Hetzner VM). TCP 22, 443, and 4222 timed out from the Mac, as did both Windows computers' HTTPS requests to the API. The Mac contains an SSH key named ~/.ssh/kocre_rmm_real with permissions 600, and its known-hosts store recognizes 5.78.108.99. A read-only SSH connection using that key timed out before authentication. No credential bytes were viewed or copied. The Hetzner console opened in the owner's ordinary Google Chrome but redirected to the provider sign-in screen; there was no authenticated provider session to check power or billing.

**Cause is not determined.** The VM may be off, firewalled, withdrawn, or unreachable for another reason. Do not assume it is a broken Tactical application, change DNS, reissue agents, or install onto a different host until the provider state is verified.


## DigitalOcean replacement — provisioned October 30, 2026

The owner confirmed the old Hetzner Tactical server is suspended and inaccessible. Rather than change the existing working recovery MeshCentral machine, an **independent** DigitalOcean server was provisioned and verified:

| Item | Verified status |
| --- | --- |
| DigitalOcean Droplet | 614278568, kocre-tactical-rmm-primary-20261030 |
| Public IPv4 | 147.182.176.4 |
| Operating system | Fresh Debian 13 (trixie), x64; only SSH originally running |
| Resources | NYC1, 2 shared vCPU, 4 GB RAM, 80 GB |
| SSH | Dedicated key in Mac ~/.ssh/kocre_tactical_do_20261030, private file mode 0600. Never print or commit key material |
| Backups | DigitalOcean console independently says Automated Weekly Backups enabled, 28-day retention |
| Estimated billing | $24/month compute + $4.80/month weekly backups = $28.80/month |

The other DigitalOcean Droplet, kocre-tactical-rmm-20261026 at 138.197.144.46, actually hosts independent meshcentral-recovery.service. It is used by remote.kocreit.com and MUST NOT be touched or repurposed.

### DNS hold — human live-change confirmation required

Vercel authoritative DNS is in the owner team komlan-kouhikos-projects (team_A3Dv2lg1siA9CtVB7BKdhkOi). These three A records are STILL pointed at the suspended Hetzner host 5.78.108.99:

| FQDN | DNS record ID | New value |
| --- | --- | --- |
| rmm.kocreit.com | rec_40ab01c018c360d00ea889eb | 147.182.176.4 |
| api-rmm.kocreit.com | rec_5f87d01e47b76ee75b041fd3 | 147.182.176.4 |
| mesh.kocreit.com | rec_8f385a5a34a111866891f4b5 | 147.182.176.4 |

Vercel connector write returned HTTP 403 / forbidden. The authenticated Mac CLI reports action_required / interactive_confirmation_required and explicitly requires the owner to run a terminal command and confirm. No DNS changes were made. Do not bypass the owner-confirmation gate through other executors.

The OWNER must run and confirm each command in their Mac Terminal, or edit these exact A records in Vercel DNS UI:

    vercel dns update rec_40ab01c018c360d00ea889eb --value 147.182.176.4 --scope komlan-kouhikos-projects
    vercel dns update rec_5f87d01e47b76ee75b041fd3 --value 147.182.176.4 --scope komlan-kouhikos-projects
    vercel dns update rec_8f385a5a34a111866891f4b5 --value 147.182.176.4 --scope komlan-kouhikos-projects

Preserve remote.kocreit.com at 138.197.144.46, all existing Kocre website records, MX and email records. The official installer also requires a temporary Let's Encrypt wildcard DNS TXT value at _acme-challenge.kocreit.com; that value is generated during the interactive trusted-cert request, not beforehand.

### OS maintenance hold — original Mac policy

An attempted prerequisite apt-get update/install over SSH via Personal Commands on the Mac was blocked at command admission by CATASTROPHIC_DISABLED ("Blocked: catastrophic system command pattern"). Read-only policy checks showed Full Control, owner trust and no emergency stop, but that does not authorize retrying via a different executor. NO OS package installation command ran on the Droplet.

When human authorization is available, perform the official Debian 13 preparation, set up the tactical sudo user and UTF-8 locale, verify persistent SSH and firewall port 22/443 access, and run the official install.sh as tactical (NOT root). Use real trusted Let's Encrypt certificates; do not use --insecure (cannot safely convert without reinstalling agent certificates). Protect bootstrap admin password and TOTP secrets.

### Release gate

This server exists and its weekly backup SCHEDULE is enabled, but Tactical RMM is NOT installed, new DNS is NOT published and no agent has re-enrolled. Do not mistake a scheduled backup for a verified restore. After installer completion verify web/API certificate, service health, first actual restorable backup, independent Mesh manual takeover, and exact owner Windows 11/10 agent re-enrollment. No old Tactical database was recovered from Hetzner.

## Product ownership

- Tactical RMM is a temporary, internal monitoring/inventory/patch/alert sensor.
- The future Kocre AI Technician is a privileged backend worker on DigitalOcean; it owns diagnosis, events, runbooks, verification and escalation.
- Personal Commands retains endpoint command execution and verification. Its separate Mesh transport is the planned human remote desktop and AI UI fallback.
- Atlas and public Kocre portal are not privileged Tactical administrator clients.
- Real session start/end evidence, tenant and entitlement binding, support authorization, and ticket outcome writeback belong in the Kocre control plane. Saving a remote_sessions database row is not evidence a desktop session opened.
- The current client-activation work in merged PR #40 does not install agents or activate unattended remediation.

## Recovery order

1. **Recover the existing VM first.** In the owner's authenticated Hetzner console, inspect server existence, IP assignment, state, firewall, maintenance/abuse notices, account billing and rescue access. Preserve the old disks, snapshots, Postgres and any available Backblaze B2 off-box backups before changing a service.
2. **Do read-only server checks.** When SSH is actually reachable, use the Mac's pre-existing SSH identity with BatchMode, IdentitiesOnly and StrictHostKeyChecking enabled. Check host identity, uptime, filesystem free space, package version, service health (rmm, Nginx, database, NATS and Mesh if installed), certificate validity, DNS consistency and logs. Do not copy keys into the GitHub repository or model responses.
3. **Choose repair versus rebuild based on evidence.** If the Hetzner VM still exists, prioritize recovery and backup verification over reinstallation. If deleted or irrecoverable, verify a usable off-box backup and plan a fresh dedicated supported Linux VM with at least 4 GB RAM. Tactical's official installer assumes a fresh server; do not run it on the existing DigitalOcean 2 GB Personal Commands browser/relay machine.
4. **Keep Mesh ownership singular.** For new Tactical agents, use the official --nomesh installation option when separate Kocre Mesh controls the desktop. Do not blindly uninstall or replace the current Windows Mesh services or packages. First verify the currently enrolled Mesh IDs and a supervised manual desktop takeover, then migrate only with a recovery path.
5. **Restore API identity safely.** After a verified dashboard, API, TLS and interactive 2FA login, issue a dedicated backend API key with only the monitoring/inventory permissions needed. Tactical API keys bypass 2FA. Inject the key into Kocre's private DigitalOcean worker secret store, not Git, browser-side JavaScript, customer portal or chat output. Rotate any compromised credentials.
6. **Bind every read to known enrollment.** The new internal sensor module at techdesk-pro/lib/rmm/tactical-monitor.mjs polls the documented GET /agents/?detail=false endpoint and returns only exact operator-verified Kocre organization/device/Tactical agent_id bindings. Missing, unknown and stale agents are not called healthy. The module has no action methods, no automatic enrollment and no externally reachable API handler.
7. **Human manual control.** Kocre technicians will launch separately controlled Mesh sessions after selecting the exact client and device, checking authorization and recording real activity. Tactical Take Control should not be represented as available on installs using --nomesh. If the older Tactical-hosted Mesh is retained, explicitly map which Mesh instance owns each device.
8. **AI Technician closed loop.** Tactical events -> verified tenant/device/entitlement -> Kocre event queue -> AI diagnosis -> Personal Commands runbook -> independent outcome verification -> ticket/activity writeback -> human takeover for exceptional work. Never give Tactical backend credentials to Atlas or accept a browser-provided agent ID as authoritative.

## Acceptance before calling it live

- Dashboard rmm.kocreit.com loads with valid TLS and authenticated operator access.
- API api-rmm.kocreit.com responds using the narrowly scoped service credential; alerts, NATS and task submission are correctly restored (write tests only on owner test machines).
- Real owner Windows 11 and Windows 10 agent IDs and heartbeat timestamps are observed and mapped to the correct Kocre test organization; no cross-tenant or unknown devices are imported.
- An actual attended manual Mesh session opens and closes, independently verified on the endpoint, with an audit record.
- An AI read-only monitor event triggers a bounded test runbook through Personal Commands and the postcondition is verified. No automatic customer actions before entitlement and authorization checks.
- Network outage, stale data, wrong organization/agent ID, duplicate telemetry, reboot/reconnect and error handling produce honest states and no duplicate effects.
- A recoverable off-box backup is proved, with daily/weekly retention policy and provider billing alerts.
- Commercial use is reviewed against the Tactical RMM license. Operating an internal MSP monitoring system is different from repackaging Tactical functions into a commercial customer-facing SaaS.

## Safe reference commands (read-only)

    dig +short A rmm.kocreit.com
    dig +short A api-rmm.kocreit.com
    dig +short A mesh.kocreit.com
    curl -I --connect-timeout 5 --max-time 12 https://api-rmm.kocreit.com/
    ssh -i ~/.ssh/kocre_rmm_real -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes -o IdentitiesOnly=yes tactical@5.78.108.99 'hostname; uptime'

**References:** Tactical official [API](https://docs.tacticalrmm.com/functions/api/), [agent install](https://docs.tacticalrmm.com/install_agent/), [Mesh integration](https://docs.tacticalrmm.com/mesh_integration/), [server installation](https://docs.tacticalrmm.com/install_server/), [license](https://docs.tacticalrmm.com/license/) and Kocre [primary vision](AI-NATIVE-MSP-PRIMARY-VISION.md).
