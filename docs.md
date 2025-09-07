# 🌀 Flint Documentation

Welcome to the complete reference for the Flint CLI and API.

## Table of Contents

- [Getting Started](#getting-started)
- [CLI Reference](#cli-reference)
  - [Global Flags](#global-flags)
  - [Commands](#commands)
    - [`flint serve`](#flint-serve)
    - [`flint launch`](#flint-launch)
    - [`flint list`](#flint-list)
    - [`flint ssh`](#flint-ssh)
    - [`flint console`](#flint-console)
    - [`flint snapshot`](#flint-snapshot)
    - [`flint delete`](#flint-delete)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
  - [Request/Response Examples](#requestresponse-examples)
  - [WebSocket Connections](#websocket-connections)

---

## Getting Started

### Prerequisites
Ensure your Linux host has `libvirt` and `qemu-kvm` installed and the `libvirtd` service is running.

### Installation
The recommended installation method is the one-liner script:
```bash
curl -fsSL https://raw.githubusercontent.com/ccheshirecat/flint/main/install.sh | sh
```
This will install the `flint` binary to `/usr/local/bin`.

### Running the Server
Start the Flint server, which includes the web UI and the REST API:
```bash
flint serve
```
By default, the UI is available at `http://localhost:5550`.

For production, it's recommended to run Flint as a `systemd` service. An example service file can be found in the repository.

---

## CLI Reference

### Global Flags
- `--socket string`: Path to the libvirt socket (default: `/var/run/libvirt/libvirt-sock`).
- `-h, --help`: Help for any command.

### Commands

#### `flint serve`
Starts the Flint web server and API.
```bash
flint serve
```

#### `flint launch`
Launch a new VM from an image or template.
```bash
flint launch [image-name-or-template] [flags]
```
**Examples:**
```bash
# Quick launch with an image and auto-detected SSH key
flint launch ubuntu-24.04 --name web-server

# Launch with custom resources
flint launch ubuntu-24.04 --name db-server --vcpus 4 --memory 8192

# Launch from a previously created snapshot/template
flint launch --from web-server --name web-server-clone

# Launch with a static IP address
flint launch ubuntu-24.04 --name api-01 --static-ip 192.168.122.50
```
**Common Flags:**
- `--name string`: Name for the new VM.
- `--from string`: Name of an existing VM to use as a template (must have snapshots).
- `--vcpus int`: Number of vCPUs (default: 2).
- `--memory int`: Memory in MB (default: 4096).
- `--disk int`: Disk size in GB (default: 20).
- `--cloud-init string`: Path to a cloud-init user-data file.
- `--ssh-key string`: Path to an SSH public key (defaults to `~/.ssh/id_*.pub`).
- `--static-ip string`: Assign a static IP address to the VM.
- `--network string`: Libvirt network to connect to (default: "default").
- `--pool string`: Storage pool for the new disk (default: "default").

---

#### `flint list` (alias: `ls`)
Lists virtual machines.
```bash
flint list [flags]
```
**Examples:**
```bash
# List only running VMs (default)
flint list

# List all VMs, including stopped ones
flint list --all

# Output in JSON format for scripting
flint list --all --format json
```
**Flags:**
- `--all`: Show all VMs (including stopped).
- `--format string`: Output format: `table` or `json` (default: "table").

---

#### `flint ssh`
SSH into a VM by name.
```bash
flint ssh <vm-name> [flags]
```
**Examples:**
```bash
# SSH as the default user (e.g., 'ubuntu')
flint ssh web-server

# SSH as root
flint ssh web-server --user root

# Execute a remote command
flint ssh web-server --command "uptime"
```
**Flags:**
- `--user string`: SSH username.
- `--command string`: Command to execute remotely.

---

#### `flint console`
Connect to the serial console of a VM.
```bash
flint console <vm-name>
```
**Note:** Press `Ctrl+]` to exit the console session.

---

#### `flint snapshot`
Manage VM snapshots.
```bash
flint snapshot <subcommand> [flags]
```
**Subcommands:**
- `create <vm-name> --name <snapshot-name>`: Create a snapshot.
- `list <vm-name>`: List snapshots for a VM.
- `revert <vm-name> <snapshot-name>`: Revert a VM to a snapshot.
- `delete <vm-name> <snapshot-name>`: Delete a snapshot.

**Examples:**
```bash
# Create a snapshot before a risky operation
flint snapshot create web-server --name "before-upgrade-v2"

# Revert to the snapshot if something goes wrong
flint snapshot revert web-server "before-upgrade-v2"
```
---

#### `flint delete`
Deletes a VM.
```bash
flint delete <vm-name> [flags]
```
**Examples:**
```bash
# Delete the VM definition but keep its disk
flint delete web-server

# Delete the VM AND its associated disk volumes
flint delete web-server --disks
```
**Flags:**
- `--disks`: Also delete all storage volumes associated with the VM.
- `--force, -f`: Skip the confirmation prompt.

---

## API Reference
The Flint API is served on the same port as the web UI (`5550` by default). All endpoints are prefixed with `/api`. The API is designed to be RESTful and predictable.

### Authentication
Currently, the API is unauthenticated for local use. Future versions will include a simple token-based auth system.

### Endpoints

#### Host
- `GET /api/host/status`: Get basic host status (hostname, hypervisor version, VM counts).
- `GET /api/host/resources`: Get host resource usage (CPU, Memory, Storage).

#### Virtual Machines (VMs)
- `GET /api/vms`: List all VMs with summary info.
- `POST /api/vms`: Create a new VM from an image.
- `GET /api/vms/{uuid}`: Get detailed information for a single VM.
- `DELETE /api/vms/{uuid}`: Delete a VM.
- `POST /api/vms/{uuid}/action`: Perform an action on a VM (e.g., `start`, `stop`).

#### Snapshots & Templates
- `GET /api/vms/{uuid}/snapshots`: List snapshots for a VM.
- `POST /api/vms/{uuid}/snapshots`: Create a new snapshot for a VM.
- `POST /api/vms/{uuid}/snapshots/{name}/revert`: Revert a VM to a snapshot.
- `DELETE /api/vms/{uuid}/snapshots/{name}`: Delete a snapshot.
- `GET /api/vm-templates`: List all VMs that can be used as templates (i.e., have snapshots).
- `POST /api/vms/from-template`: Create a new VM from a template.

#### Infrastructure
- `GET /api/storage-pools`: List all storage pools.
- `GET /api/storage-pools/{pool}/volumes`: List volumes in a specific pool.
- `GET /api/networks`: List all libvirt networks.

### Request/Response Examples

#### Create a New VM
`POST /api/vms`
```json
// Request Body
{
  "name": "api-server-01",
  "memoryMB": 2048,
  "vcpus": 2,
  "diskSizeGB": 20,
  "imageName": "ubuntu-24.04",
  "startOnCreate": true
}
```

#### Perform a VM Action
`POST /api/vms/YOUR_VM_UUID/action`
```json
// Request Body
{
  "action": "stop"
}
```
*Supported actions: `start`, `stop`, `reboot`, `pause`, `resume`, `force-stop` (destroy).*

### WebSocket Connections
Flint uses WebSockets for real-time serial console access.
- `GET /api/vms/{uuid}/console-stream`: Connect to this endpoint to stream console output.