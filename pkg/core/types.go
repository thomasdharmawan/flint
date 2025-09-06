package core

// HealthCheck represents a system health status
type HealthCheck struct {
	Type    string `json:"type"` // "warning", "info", "error"
	Message string `json:"message"`
}

// HostStatus is the light-weight host summary for the frontend/CLI.
type HostStatus struct {
	Hostname          string        `json:"hostname"`
	HypervisorVersion string        `json:"hypervisor_version"`
	TotalVMs          int           `json:"total_vms"`
	RunningVMs        int           `json:"running_vms"`
	PausedVMs         int           `json:"paused_vms"`
	ShutOffVMs        int           `json:"shutoff_vms"`
	HealthChecks      []HealthCheck `json:"health_checks"`
}

// HostResources is an aggregate view of memory/cpu/storage.
type HostResources struct {
	TotalMemoryKB    uint64 `json:"total_memory_kb"`
	FreeMemoryKB     uint64 `json:"free_memory_kb"`
	CPUCores         int    `json:"cpu_cores"`
	StorageTotalB    uint64 `json:"storage_total_b"`
	StorageUsedB     uint64 `json:"storage_used_b"`
	ActiveInterfaces int    `json:"active_interfaces"`
}

// VM_Summary is the light info for lists.
type VM_Summary struct {
	Name        string   `json:"name"`
	UUID        string   `json:"uuid"`
	State       string   `json:"state"`
	MemoryKB    uint64   `json:"memory_kb"`
	VCPUs       int      `json:"vcpus"`
	CPUPercent  float64  `json:"cpu_percent"` // computed over sample window
	UptimeSec   uint64   `json:"uptime_sec"`
	OSInfo      string   `json:"os_info"`
	IPAddresses []string `json:"ip_addresses"`
}

// Disk / NIC small models for detailed view:
type Disk struct {
	SourcePath string `json:"source_path"`
	TargetDev  string `json:"target_dev"`
	Device     string `json:"device"`
}

type NIC struct {
	MAC    string `json:"mac"`
	Source string `json:"source"`
	Model  string `json:"model"`
}

// VM_Detailed is the rich VM view.
type VM_Detailed struct {
	VM_Summary
	MaxMemoryKB uint64 `json:"max_memory_kb"` // <-- ADD THIS
	XML         string `json:"xml"`
	Disks       []Disk `json:"disks"`
	Nics        []NIC  `json:"nics"`
	OS          string `json:"os"` // simple OS info parsed from XML <os> block
}

// CloudInitConfig represents cloud-init configuration
type CloudInitConfig struct {
	CommonFields CloudInitCommonFields `json:"commonFields"`
	RawUserData  string                `json:"rawUserData"`
}

// CloudInitNetworkConfig represents network configuration for cloud-init
type CloudInitNetworkConfig struct {
	UseDHCP    bool     `json:"useDHCP"`
	IPAddress  string   `json:"ipAddress,omitempty"`
	Prefix     int      `json:"prefix,omitempty"`
	Gateway    string   `json:"gateway,omitempty"`
	DNSServers []string `json:"dnsServers,omitempty"`
}

// CloudInitCommonFields represents common cloud-init settings
type CloudInitCommonFields struct {
	Hostname      string                  `json:"hostname"`
	Username      string                  `json:"username"`
	Password      string                  `json:"password"`
	Packages      []string                `json:"packages,omitempty"`
	SSHKeys       string                  `json:"sshKeys"`
	NetworkConfig *CloudInitNetworkConfig `json:"networkConfig,omitempty"`
}

// VMCreationConfig - updated for cloud-init and image library
type VMCreationConfig struct {
	Name            string
	MemoryMB        uint64
	VCPUs           int
	ImageName       string // from managed image library
	ImageType       string // "iso" or "template"
	StartOnCreate   bool
	NetworkName     string           // libvirt network name (ex: default)
	CloudInit       *CloudInitConfig `json:"cloudInit,omitempty"`
	DiskPool        string
	DiskSizeGB      uint64
	EnableCloudInit bool
}

// Storage / Volume types:
type StoragePool struct {
	Name        string `json:"name"`
	State       string `json:"state"` // <-- ADD THIS FIELD
	CapacityB   uint64 `json:"capacity_b"`
	AllocationB uint64 `json:"allocation_b"`
}

type Volume struct {
	Name     string `json:"name"`
	Path     string `json:"path"`
	Capacity uint64 `json:"capacity_b"`
}

type VolumeConfig struct {
	Name   string
	SizeGB uint64
}

type Image struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Pool  string `json:"pool"`
	Path  string `json:"path"`
	SizeB uint64 `json:"size_b"`
	Type  string `json:"type"` // "iso" or "template"
}

type PerformanceSample struct {
	CPUNanoSecs    uint64 `json:"cpu_nanosecs"`
	MemoryUsedKB   uint64 `json:"memory_used_kb"`
	DiskReadBytes  uint64 `json:"disk_read_bytes"`
	DiskWriteBytes uint64 `json:"disk_write_bytes"`
	NetRxBytes     uint64 `json:"net_rx_bytes"`
	NetTxBytes     uint64 `json:"net_tx_bytes"`
}

// ADD THIS NEW STRUCT FOR SNAPSHOTS
type Snapshot struct {
	Name        string `json:"name"`
	State       string `json:"state"`
	CreationTS  int64  `json:"creation_ts"` // Unix timestamp
	Description string `json:"description"`
}

// CreateSnapshotRequest is the body for the snapshot creation endpoint.
type CreateSnapshotRequest struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
}

// ADD a type for Network
type Network struct {
	Name         string `json:"name"`
	UUID         string `json:"uuid"`
	IsActive     bool   `json:"is_active"`
	IsPersistent bool   `json:"is_persistent"`
	Bridge       string `json:"bridge"`
	// Future fields: Type (NAT/Bridged), DHCP Range, etc.
}

// ADD a type for Activity Log
type ActivityEvent struct {
	ID        string `json:"id"`
	Timestamp int64  `json:"timestamp"` // Unix timestamp
	Action    string `json:"action"`    // "VM Started", "Snapshot Created"
	Target    string `json:"target"`    // "web-server-01"
	Status    string `json:"status"`    // "Success", "Error"
	Message   string `json:"message"`
}
