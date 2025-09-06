package libvirtclient

import (
	"fmt"
	"github.com/ccheshirecat/flint/pkg/core"
)

// GetNetworks fetches all virtual networks.
func (c *Client) GetNetworks() ([]core.Network, error) {
	// ListAllNetworks is the most reliable method.
	networks, err := c.conn.ListAllNetworks(0)
	if err != nil {
		return nil, fmt.Errorf("list networks: %w", err)
	}

	out := make([]core.Network, 0, len(networks))
	for _, n := range networks {
		defer n.Free()
		name, _ := n.GetName()
		uuid, _ := n.GetUUIDString()
		isActive, _ := n.IsActive()
		isPersistent, _ := n.IsPersistent()
		bridge, _ := n.GetBridgeName()

		out = append(out, core.Network{
			Name:         name,
			UUID:         uuid,
			IsActive:     isActive,
			IsPersistent: isPersistent,
			Bridge:       bridge,
		})
	}
	return out, nil
}

// CreateNetwork creates a new virtual network with the specified name and bridge name.
func (c *Client) CreateNetwork(name string, bridgeName string) error {
	// Define the network XML
	networkXML := fmt.Sprintf(`<network>
      <name>%s</name>
      <bridge name='%s' stp='on' delay='0'/>
      <forward mode='nat'/>
      <ip address='192.168.%d.1' netmask='255.255.255.0'>
        <dhcp>
          <range start='192.168.%d.10' end='192.168.%d.254'/>
        </dhcp>
      </ip>
    </network>`, name, bridgeName, generateNetworkID(), generateNetworkID(), generateNetworkID())

	// Define the network
	network, err := c.conn.NetworkDefineXML(networkXML)
	if err != nil {
		return fmt.Errorf("failed to define network: %w", err)
	}
	defer network.Free()

	// Set autostart
	if err := network.SetAutostart(true); err != nil {
		return fmt.Errorf("failed to set network autostart: %w", err)
	}

	// Activate the network
	if err := network.Create(); err != nil {
		return fmt.Errorf("failed to create network: %w", err)
	}

	return nil
}

// DeleteNetwork deletes a virtual network by name
func (c *Client) DeleteNetwork(name string) error {
	// Look up the network by name
	network, err := c.conn.LookupNetworkByName(name)
	if err != nil {
		return fmt.Errorf("failed to lookup network '%s': %w", name, err)
	}
	defer network.Free()

	// Check if network is active and destroy it first
	isActive, err := network.IsActive()
	if err != nil {
		return fmt.Errorf("failed to check network status: %w", err)
	}

	if isActive {
		if err := network.Destroy(); err != nil {
			return fmt.Errorf("failed to destroy network: %w", err)
		}
	}

	// Undefine the network (removes it permanently)
	if err := network.Undefine(); err != nil {
		return fmt.Errorf("failed to undefine network: %w", err)
	}

	return nil
}

// generateNetworkID generates a unique ID for the network (in a real implementation, you might want to check for conflicts)
func generateNetworkID() int {
	// For now, we'll use a simple static value
	// In a real implementation, you'd want to generate a unique ID
	return 100
}