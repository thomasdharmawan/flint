# 🌀 Flint — KVM Management, Reimagined

<p align="center">
  <img src="https://i.ibb.co/yj2bFZG/flint-banner.jpg" alt="Flint Logo" width="300"/>
</p>

<p align="center">
  <strong>
    A single &lt;8MB binary with a modern Web UI, CLI, and API for KVM.
    <br/>No XML. No bloat. Just VMs.
  </strong>
</p>

<p align="center">
  <a href="https://github.com/ccheshirecat/flint/releases/latest">
    <img src="https://img.shields.io/github/v/release/ccheshirecat/flint" alt="Latest Release">
  </a>
  <a href="https://github.com/ccheshirecat/flint/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/ccheshirecat/flint" alt="License">
  </a>
  <a href="https://github.com/ccheshirecat/flint/actions/workflows/release.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/ccheshirecat/flint/.github/workflows/release.yml" alt="Build Status">
  </a>
</p>

---

![Flint Dashboard](https://i.ibb.co/wN9H8WKX/Screenshot-2025-09-07-at-3-51-58-AM.png)

Flint is a modern, self-contained KVM management tool built for developers, sysadmins, and home labs who want zero bloat and maximum efficiency. It was built in a few hours out of a sudden urge for something better.

---

### 🚀 One-Liner Install

**Prerequisites:** A Linux host with `libvirt` and `qemu-kvm` installed.

```bash
curl -fsSL https://raw.githubusercontent.com/ccheshirecat/flint/main/install.sh | sh
```
*Auto-detects OS/arch, installs to `/usr/local/bin`, and you're ready in seconds.*

---

### ✨ Core Philosophy

-   🖥️ **Modern UI** — A beautiful, responsive Next.js + Tailwind interface, fully embedded.
-   ⚡ **Single Binary** — No containers, no XML hell. A sub-8MB binary is all you need.
-   🛠️ **Powerful CLI & API** — Automate everything. If you can do it in the UI, you can do it from the command line or API.
-   📦 **Frictionless Provisioning** — Native Cloud-Init support and a simple, snapshot-based template system.
-   💪 **Non-Intrusive** — Flint is a tool that serves you. It's not a platform that locks you in.

---

### 🏎️ Quickstart

**1. Start the Server**
```bash
flint serve
```
*   **Web UI:** `http://localhost:5550`
*   **API:** `http://localhost:5550/api`

**2. Use the CLI**
```bash
# List your VMs
flint vm list --all

# Launch a new Ubuntu VM named 'web-01'
flint launch ubuntu-24.04 --name web-01

# SSH directly into your new VM
flint ssh web-01

# Create a template from your configured VM
flint snapshot create web-01 --tag baseline-setup

# Launch a clone from your new template
flint launch --from web-01 --name web-02
```
---

### 📖 Full Documentation

While Flint is designed to be intuitive, the full CLI and API documentation, including all commands and examples, is available at:

➡️ **[DOCS.md](docs.md)**

---

### 🔧 Tech Stack

-   **Backend:** Go 1.25+
-   **Web UI:** Next.js + Tailwind + Bun
-   **KVM Integration:** libvirt-go
-   **Binary Size:** ~8.4MB (stripped)

---

<p align="center">
  <b>🚀 Flint is young, fast-moving, and designed for builders.<br/>
  Try it. Break it. Star it. Contribute.</b>
</p>