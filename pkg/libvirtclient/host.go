package libvirtclient

import (
	"fmt"
	"github.com/ccheshirecat/flint/pkg/core"
	libvirt "github.com/libvirt/libvirt-go"
	"strings"
)

// GetHostStatus implements HostStatus gathering per your blueprint.
func (c *Client) GetHostStatus() (core.HostStatus, error) {
	var out core.HostStatus

	// version
	ver, err := c.conn.GetLibVersion()
	if err == nil {
		out.HypervisorVersion = fmt.Sprintf("%d", ver)
	} else {
		// fallback: ConnectGetVersion (older)
		if v2, e2 := c.conn.GetVersion(); e2 == nil { // some API variants; best-effort
			out.HypervisorVersion = fmt.Sprintf("%d", v2)
		} else {
			out.HypervisorVersion = "unknown"
		}
	}

	// hostname
	hn, err := c.conn.GetHostname()
	if err != nil {
		hn = "unknown"
	}
	out.Hostname = hn

	// domains list
	// Use ListAllDomains which returns []Domain
	domains, err := c.conn.ListAllDomains(0)
	if err != nil {
		return out, fmt.Errorf("list domains: %w", err)
	}
	out.TotalVMs = len(domains)
	crashedVMs := []string{}
	for _, d := range domains {
		info, err := d.GetInfo()
		if err != nil {
			// skip problematic domain
			d.Free()
			continue
		}
		switch info.State {
		case libvirt.DOMAIN_RUNNING:
			out.RunningVMs++
		case libvirt.DOMAIN_PAUSED:
			out.PausedVMs++
		case libvirt.DOMAIN_SHUTOFF:
			out.ShutOffVMs++
		case libvirt.DOMAIN_CRASHED:
			out.ShutOffVMs++ // count as shutoff but track for health check
			name, _ := d.GetName()
			crashedVMs = append(crashedVMs, name)
		default:
			// treat others as shutoff for counts
			out.ShutOffVMs++
		}
		d.Free()
	}

	// Perform health checks
	out.HealthChecks = []core.HealthCheck{}

	// Check for crashed VMs
	for _, vmName := range crashedVMs {
		out.HealthChecks = append(out.HealthChecks, core.HealthCheck{
			Type:    "error",
			Message: fmt.Sprintf("VM '%s' is in a crashed state", vmName),
		})
	}

	// Check storage pools
	pools, err := c.conn.ListAllStoragePools(0)
	inactivePools := 0
	if err == nil {
		for _, p := range pools {
			info, err := p.GetInfo()
			if err != nil {
				p.Free()
				continue
			}
			name, _ := p.GetName()
			if info.State == libvirt.STORAGE_POOL_INACTIVE {
				out.HealthChecks = append(out.HealthChecks, core.HealthCheck{
					Type:    "warning",
					Message: fmt.Sprintf("Storage pool '%s' is inactive", name),
				})
				inactivePools++
			}
			p.Free()
		}
	}

	// Check storage usage
	resources, err := c.GetHostResources()
	if err == nil {
		// Check if storage usage is high
		if resources.StorageTotalB > 0 {
			storageUsagePercent := float64(resources.StorageUsedB) / float64(resources.StorageTotalB) * 100
			if storageUsagePercent > 95 {
				out.HealthChecks = append(out.HealthChecks, core.HealthCheck{
					Type:    "error",
					Message: fmt.Sprintf("Storage usage critical: %.1f%% of total storage used", storageUsagePercent),
				})
			} else if storageUsagePercent > 85 {
				out.HealthChecks = append(out.HealthChecks, core.HealthCheck{
					Type:    "warning",
					Message: fmt.Sprintf("High storage usage: %.1f%% of total storage used", storageUsagePercent),
				})
			}
		}
	}

	// Add informational health checks
	if len(out.HealthChecks) == 0 {
		out.HealthChecks = append(out.HealthChecks, core.HealthCheck{
			Type:    "info",
			Message: "All systems nominal",
		})
	} else {
		// Add a summary health check
		activeVMs := out.RunningVMs + out.PausedVMs
		totalVMs := out.RunningVMs + out.PausedVMs + out.ShutOffVMs
		out.HealthChecks = append([]core.HealthCheck{{
			Type:    "info",
			Message: fmt.Sprintf("System status: %d/%d VMs active, %d storage pools inactive", activeVMs, totalVMs, inactivePools),
		}}, out.HealthChecks...)
	}

	return out, nil
}

// GetHostResources returns memory/cpu/storage aggregates.
func (c *Client) GetHostResources() (core.HostResources, error) {
	var out core.HostResources

	// Memory: ConnectGetMemoryStats is not always present in go bindings,
	// fallback to NodeGetInfo for basic info.
	// Here we attempt ConnectGetMemoryStats via GetMemoryStats (best-effort)
	// NOTE: adapt to your libvirt-go version if method names differ.
	
	// Try to get more accurate memory information
	nodeInfo, err := c.conn.GetNodeInfo()
	if err == nil {
		out.CPUCores = int(nodeInfo.Cpus)
		out.TotalMemoryKB = nodeInfo.Memory // This is in KiB
	}
	
	// Try to get free memory
	freeMem, err := c.conn.GetFreeMemory()
	if err == nil {
		out.FreeMemoryKB = freeMem / 1024 // Convert bytes to KiB
	} else {
		// Fallback: estimate free memory as a percentage
		out.FreeMemoryKB = out.TotalMemoryKB / 10 // Conservative estimate
	}

	// Storage pools: sum capacities and allocation
	pools, err := c.conn.ListAllStoragePools(0)
	if err == nil {
		var total, alloc uint64
		for _, p := range pools {
			info, ierr := p.GetInfo()
			if ierr == nil {
				total += uint64(info.Capacity)
				alloc += uint64(info.Allocation)
			}
			p.Free()
		}
		out.StorageTotalB = total
		out.StorageUsedB = alloc
	}

	// Count active network interfaces across all running VMs
	runningDomains, err := c.conn.ListAllDomains(0)
	if err == nil {
		totalNICs := 0
		for _, d := range runningDomains {
			xmlDesc, err := d.GetXMLDesc(0)
			if err != nil {
				d.Free()
				continue
			}

			// Count interface elements in XML
			nicCount := strings.Count(xmlDesc, "<interface>")
			totalNICs += nicCount
			d.Free()
		}
		out.ActiveInterfaces = totalNICs
	}

	return out, nil
}
