# flint — Modern KVM Management UI

<p align="center">
  <img src="https://i.ibb.co/yj2bFZG/flint-banner.jpg" alt="flint Logo" width="300"/>
</p>

<p align="center">
  <strong>A sleek, self-contained, drop-in web UI, CLI and API for KVM virtualization.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/ccheshirecat/flint" alt="Latest Release">
  <img src="https://img.shields.io/github/license/ccheshirecat/flint" alt="License">
   <img src="https://img.shields.io/github/actions/workflow/status/ccheshirecat/flint/.github/workflows/release.yml" alt="Release Status">
</p>

---

![flint Dashboard](https://i.ibb.co/wN9H8WKX/Screenshot-2025-09-07-at-3-51-58-AM.png)

flint is a **single binary**, fully self-contained KVM management solution designed for **developers, sysadmins, and advanced home labs**. Manage virtual machines efficiently without the overhead of complex platforms.

---

## Core Philosophy

- **Single Drop-In Binary** — No installers or dependencies(other than libvirt). Self contained 8.4mb binary including web UI. Run it and you’re operational.  
- **Focused, Modern UI** — Built with Next.js + Tailwind CSS for a clean, responsive interface.  
- **Frictionless Provisioning** — Cloud-Init support, managed image library, and multiple import options.  
- **Non-Intrusive** — flint lives on your host as a tool, never as a platform you’re locked into.  

---

## Quickstart

**Prerequisites:** Linux host with `libvirt` and `qemu-kvm` installed. For building from source: Go 1.25.0 and bun/node.js.

### Download Precompiled Binary (Recommended)

Download the precompiled binary from releases, then run `./flint serve`.

### Build from Source

If you prefer to build from source:

1. **Install Go** (if not already installed)
2. **Clone the repository**
   ```bash
   git clone https://github.com/ccheshirecat/flint.git
   cd flint
   ```
3. **Build the web UI**
    ```bash
    cd web
    bun install
    bun run build
    cd ..
    ```
   The Next.js export site will be available in `web/out/`
4. **Build the binary**
   ```bash
   go build -o flint .
   ```

### Running Flint

After installation or building:

```bash
./flint serve
```

The web UI will be available at `http://localhost:5550`. The binary includes the web interface and serves it directly.

**Running in background:**
```bash
# Using nohup
nohup ./flint serve &

# Or set up systemd service
sudo systemctl enable flint
sudo systemctl start flint
```

**Dependencies:** For precompiled binary: only `libvirt` and `qemu-kvm`. For building from source: Go 1.25.0, `libvirt`, `qemu-kvm`, and bun/node.js.

### Precompiled Binaries

Precompiled binaries (8.4mb) are available for download from the [releases page](https://github.com/ccheshirecat/flint/releases).

### Automated CI/CD Releases
GitHub Actions automates building and publishing cross-compiled binaries on tag pushes (e.g., `git tag v1.0.0 && git push origin v1.0.0`). The workflow builds the Next.js web UI with Bun, embeds it into the Go binary using go:embed, and releases ZIP archives for Linux (AMD64/ARM64), macOS (AMD64), and Windows (AMD64).

Supported Platforms:
- Linux AMD64, ARM64
- Darwin (macOS) AMD64
- Windows AMD64

Binaries are dynamically linked with libvirt as the only runtime dependency and stripped (-ldflags="-s -w"). See [.github/workflows/release.yml](.github/workflows/release.yml) for details.

### Documentation and API

Check out docs.md for more details