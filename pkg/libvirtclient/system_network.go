package libvirtclient

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"
	"github.com/ccheshirecat/flint/pkg/core"
)

// GetSystemInterfaces returns all system network interfaces
func (c *Client) GetSystemInterfaces() ([]core.SystemInterface, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, fmt.Errorf("failed to get network interfaces: %w", err)
	}

	var systemInterfaces []core.SystemInterface

	for _, iface := range interfaces {
		// Skip loopback interface
		if iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		sysIface := core.SystemInterface{
			Name:       iface.Name,
			MACAddress: iface.HardwareAddr.String(),
			MTU:        iface.MTU,
		}

		// Determine interface type
		sysIface.Type = determineInterfaceType(iface.Name)

		// Get interface state
		if iface.Flags&net.FlagUp != 0 {
			sysIface.State = "up"
		} else {
			sysIface.State = "down"
		}

		// Get IP addresses
		addrs, err := iface.Addrs()
		if err == nil {
			for _, addr := range addrs {
				if ipnet, ok := addr.(*net.IPNet); ok {
					sysIface.IPAddresses = append(sysIface.IPAddresses, ipnet.String())
				}
			}
		}

		// Get network statistics
		stats, err := getInterfaceStats(iface.Name)
		if err == nil {
			sysIface.RxBytes = stats.RxBytes
			sysIface.TxBytes = stats.TxBytes
			sysIface.RxPackets = stats.RxPackets
			sysIface.TxPackets = stats.TxPackets
		}

		// Get interface speed
		speed, err := getInterfaceSpeed(iface.Name)
		if err == nil {
			sysIface.Speed = speed
		}

		systemInterfaces = append(systemInterfaces, sysIface)
	}

	return systemInterfaces, nil
}

// determineInterfaceType determines the type of network interface
func determineInterfaceType(name string) string {
	switch {
	case strings.HasPrefix(name, "br"):
		return "bridge"
	case strings.HasPrefix(name, "tap"):
		return "tap"
	case strings.HasPrefix(name, "vnet"):
		return "virtual"
	case strings.HasPrefix(name, "virbr"):
		return "libvirt-bridge"
	case strings.HasPrefix(name, "en"):
		return "physical"
	case strings.HasPrefix(name, "eth"):
		return "physical"
	case strings.HasPrefix(name, "wl"):
		return "wireless"
	default:
		return "unknown"
	}
}

// InterfaceStats represents network interface statistics
type InterfaceStats struct {
	RxBytes   uint64
	TxBytes   uint64
	RxPackets uint64
	TxPackets uint64
}

// getInterfaceStats reads network statistics from /proc/net/dev
func getInterfaceStats(interfaceName string) (*InterfaceStats, error) {
	file, err := os.Open("/proc/net/dev")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, interfaceName+":") {
			fields := strings.Fields(line)
			if len(fields) >= 10 {
				rxBytes, _ := strconv.ParseUint(fields[1], 10, 64)
				rxPackets, _ := strconv.ParseUint(fields[2], 10, 64)
				txBytes, _ := strconv.ParseUint(fields[9], 10, 64)
				txPackets, _ := strconv.ParseUint(fields[10], 10, 64)

				return &InterfaceStats{
					RxBytes:   rxBytes,
					TxBytes:   txBytes,
					RxPackets: rxPackets,
					TxPackets: txPackets,
				}, nil
			}
		}
	}

	return nil, fmt.Errorf("interface %s not found in /proc/net/dev", interfaceName)
}

// getInterfaceSpeed reads interface speed from sysfs
func getInterfaceSpeed(interfaceName string) (string, error) {
	speedPath := fmt.Sprintf("/sys/class/net/%s/speed", interfaceName)
	data, err := os.ReadFile(speedPath)
	if err != nil {
		return "Unknown", nil // Not all interfaces have speed (e.g., virtual ones)
	}

	speed := strings.TrimSpace(string(data))
	if speed == "-1" {
		return "Unknown", nil
	}

	speedInt, err := strconv.Atoi(speed)
	if err != nil {
		return "Unknown", nil
	}

	if speedInt >= 1000 {
		return fmt.Sprintf("%.1f Gbps", float64(speedInt)/1000), nil
	}
	return fmt.Sprintf("%d Mbps", speedInt), nil
}