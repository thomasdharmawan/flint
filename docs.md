# Flint Documentation

## Getting Started

### Running the Server

Start the Flint server with:

```bash
./flint serve
```

The web UI will be available at `http://localhost:5550`. The binary includes the complete web interface and serves it directly.

**Running in background:**
```bash
# Using nohup
nohup ./flint serve &

# Or set up systemd service
sudo systemctl enable flint
sudo systemctl start flint
```

**Dependencies:** Only `libvirt` and `qemu-kvm` are required on the host system.

## CLI Reference

### Global Options

- `--socket`: Path to the libvirt socket (default: `/var/run/libvirt/libvirt-sock`)

### Commands

#### `flint serve`

Start the flint web server on port 5550.

```bash
flint serve
```

#### `flint launch [image-name]`

Launch a new VM with smart defaults. Supports launching from images or templates.

**Examples:**
```bash
# Quick launch with auto-detected SSH key
flint launch ubuntu-24.04 --name web-server

# Launch with custom resources
flint launch ubuntu-24.04 --name db-server --vcpus 4 --memory 8192

# Launch from template
flint launch --from my-template --name new-server

# Launch with static IP
flint launch ubuntu-24.04 --name api-server --static-ip 192.168.1.100 --gateway 192.168.1.1
```

**Flags:**
- `--name`: VM name (auto-generated if not specified)
- `--cloud-init`: Path to cloud-init YAML file
- `--vcpus`: Number of vCPUs (default: 2)
- `--memory`: Memory in MB (default: 4096)
- `--disk`: Disk size in GB (default: 20)
- `--network`: Network name (default: "default")
- `--pool`: Storage pool name (default: "default")
- `--from`: Launch from template
- `--ssh-key`: SSH public key (auto-detected if not specified)
- `--user`: Default username (default: "ubuntu")
- `--password`: Default password
- `--static-ip`: Static IP address
- `--gateway`: Gateway IP (required with --static-ip)
- `--dns`: DNS servers (comma-separated, default: "8.8.8.8,1.1.1.1")

#### `flint list` (alias: `ls`)

List virtual machines with their status and basic info.

**Examples:**
```bash
flint list                    # List running VMs
flint list --all              # List all VMs (including stopped)
flint list --format json      # JSON output
```

**Flags:**
- `--format`: Output format (table, json) (default: "table")
- `--all`: Show all VMs (including stopped)

#### `flint ssh [vm-name]`

SSH into a virtual machine by name or UUID.

**Examples:**
```bash
flint ssh web-server           # SSH as default user
flint ssh web-server --user root
flint ssh web-server --copy    # Copy SSH command to clipboard
flint ssh web-server --command "systemctl status nginx"
```

**Flags:**
- `--user`: SSH username (default: "ubuntu")
- `--command`: Command to execute via SSH
- `--copy`: Copy SSH command to clipboard instead of executing

#### `flint console [vm-name]`

Connect to the serial console of a virtual machine.

**Examples:**
```bash
flint console web-server       # Connect to console
```

**Notes:**
- Press Ctrl+] to disconnect

#### `flint snapshot`

Manage VM snapshots for quick VM templating.

**Subcommands:**

##### `flint snapshot create [vm-name]`

Create a snapshot of a VM.

**Examples:**
```bash
flint snapshot create web-server --name base-config
flint snapshot create web-server --name "after-nginx-install" --description "Web server with nginx configured"
```

**Flags:**
- `--name`: Snapshot name (required)
- `--description`: Snapshot description

##### `flint snapshot list [vm-name]`

List snapshots for a VM.

**Examples:**
```bash
flint snapshot list web-server
```

##### `flint snapshot revert [vm-name] [snapshot-name]`

Revert VM to a snapshot.

**Examples:**
```bash
flint snapshot revert web-server base-config
```

#### `flint delete [vm-name]`

Delete a virtual machine and optionally its disks.

**Examples:**
```bash
flint delete web-server                    # Delete VM (keep disks)
flint delete web-server --disks           # Delete VM and disks
flint delete web-server --force           # Skip confirmation
```

**Flags:**
- `--force`: Skip confirmation prompt
- `--disks`: Also delete VM disks

## API Reference

The Flint API runs on port 5550 by default. All endpoints are prefixed with `/api`.

### Authentication

Some endpoints require authentication tokens. Use the WebSocket endpoints with tokens obtained from the serial console endpoints.

### Endpoints

#### SSH Key Detection

- `GET /api/ssh-key/detect` - Detect SSH public key from user's home directory

#### VM Management

- `GET /api/vms` - List all VMs
- `POST /api/vms` - Create a new VM
- `POST /api/vms/from-template` - Create VM from template
- `GET /api/vms/{uuid}` - Get VM details
- `DELETE /api/vms/{uuid}` - Delete VM
- `POST /api/vms/{uuid}/action` - Perform action on VM (start, stop, etc.)

#### VM Console

- `GET /api/vms/{uuid}/serial-console` - Get serial console WebSocket info
- `GET /api/vms/{uuid}/serial-console/ws` - WebSocket endpoint for serial console
- `GET /api/vms/{uuid}/console-stream` - Get console stream WebSocket info

#### VM Snapshots

- `GET /api/vms/{uuid}/snapshots` - List VM snapshots
- `POST /api/vms/{uuid}/snapshots` - Create VM snapshot
- `DELETE /api/vms/{uuid}/snapshots/{snapshotName}` - Delete VM snapshot
- `POST /api/vms/{uuid}/snapshots/{snapshotName}/revert` - Revert to snapshot

#### VM Templates

- `GET /api/vm-templates` - List available VM templates
- `POST /api/vm-templates` - Create new template from VM

#### VM Performance

- `GET /api/vms/{uuid}/performance` - Get VM performance metrics

#### Host Information

- `GET /api/host/status` - Get host status
- `GET /api/host/resources` - Get host resources

#### Storage Management

- `GET /api/storage-pools` - List storage pools
- `GET /api/storage-pools/{poolName}/volumes` - List volumes in pool
- `POST /api/storage-pools/{poolName}/volumes` - Create volume

#### Network Management

- `GET /api/networks` - List networks
- `POST /api/networks` - Create network
- `DELETE /api/networks/{networkName}` - Delete network

#### Image Management

- `GET /api/images` - List images
- `POST /api/images/import-from-path` - Import image from path
- `POST /api/images/download` - Download image from URL
- `DELETE /api/images/{imageId}` - Delete image

#### Activity Logs

- `GET /api/activity` - Get activity logs

### Request/Response Examples

#### Create VM

```bash
POST /api/vms
Content-Type: application/json

{
  "name": "web-server",
  "memoryMB": 4096,
  "vcpus": 2,
  "diskPool": "default",
  "diskSizeGB": 20,
  "imageName": "ubuntu-24.04",
  "imageType": "template",
  "enableCloudInit": true,
  "startOnCreate": true,
  "networkName": "default"
}
```

#### VM Action

```bash
POST /api/vms/{uuid}/action
Content-Type: application/json

{
  "action": "start"
}
```

Supported actions: start, stop, restart, suspend, resume, destroy

#### Create Snapshot

```bash
POST /api/vms/{uuid}/snapshots
Content-Type: application/json

{
  "name": "base-config",
  "description": "Base configuration snapshot"
}
```

### WebSocket Connections

#### Serial Console

1. Get WebSocket info: `GET /api/vms/{uuid}/serial-console`
2. Connect to: `ws://localhost:5550/api/vms/{uuid}/serial-console/ws?token={token}`

The WebSocket supports bidirectional communication for interactive console sessions.