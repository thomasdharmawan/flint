package libvirtclient

import (
	"encoding/xml"
	"fmt"
	"github.com/ccheshirecat/flint/pkg/core"
	libvirt "github.com/libvirt/libvirt-go"
)

// GetVMSnapshots lists all snapshots for a given VM.
func (c *Client) GetVMSnapshots(uuidStr string) ([]core.Snapshot, error) {
	dom, err := c.conn.LookupDomainByUUIDString(uuidStr)
	if err != nil {
		return nil, fmt.Errorf("lookup domain: %w", err)
	}
	defer dom.Free()

	// Get snapshot names first
	snapNames, err := dom.SnapshotListNames(0)
	if err != nil {
		return nil, fmt.Errorf("list snapshot names: %w", err)
	}

	out := make([]core.Snapshot, 0, len(snapNames))
	for _, snapName := range snapNames {
		snap, err := dom.SnapshotLookupByName(snapName, 0)
		if err != nil {
			continue // Skip snapshots we can't access
		}

		xmlDesc, err := snap.GetXMLDesc(0)
		if err != nil {
			snap.Free()
			continue // Skip snapshots we can't read
		}

		// Unmarshal the snapshot XML to get details
		type snapshotXML struct {
			Name         string `xml:"name"`
			Description  string `xml:"description"`
			State        string `xml:"state"`
			CreationTime int64  `xml:"creationTime"`
		}
		var sx snapshotXML
		if xml.Unmarshal([]byte(xmlDesc), &sx) == nil {
			out = append(out, core.Snapshot{
				Name:        sx.Name,
				State:       sx.State,
				CreationTS:  sx.CreationTime,
				Description: sx.Description,
			})
		}
		snap.Free()
	}
	return out, nil
}

// CreateVMSnapshot creates a new snapshot from a name and description.
func (c *Client) CreateVMSnapshot(uuidStr string, cfg core.CreateSnapshotRequest) (core.Snapshot, error) {
	dom, err := c.conn.LookupDomainByUUIDString(uuidStr)
	if err != nil {
		return core.Snapshot{}, fmt.Errorf("lookup domain: %w", err)
	}
	defer dom.Free()

	// Generate snapshot XML
	xmlDesc := fmt.Sprintf(`<domainsnapshot>
  <name>%s</name>
  <description>%s</description>
</domainsnapshot>`, cfg.Name, cfg.Description)

	snap, err := dom.CreateSnapshotXML(xmlDesc, 0)
	if err != nil {
		return core.Snapshot{}, fmt.Errorf("create snapshot: %w", err)
	}
	defer snap.Free()

	// Get snapshot details
	return c.getSnapshotDetails(snap)
}

// DeleteVMSnapshot deletes a snapshot by its name.
func (c *Client) DeleteVMSnapshot(uuidStr string, snapshotName string) error {
	dom, err := c.conn.LookupDomainByUUIDString(uuidStr)
	if err != nil {
		return fmt.Errorf("lookup domain: %w", err)
	}
	defer dom.Free()

	snap, err := dom.SnapshotLookupByName(snapshotName, 0)
	if err != nil {
		return fmt.Errorf("snapshot '%s' not found: %w", snapshotName, err)
	}
	defer snap.Free()

	// The '0' flag means default behavior.
	return snap.Delete(0)
}

// RevertToVMSnapshot reverts a VM's state.
func (c *Client) RevertToVMSnapshot(uuidStr string, snapshotName string) error {
	dom, err := c.conn.LookupDomainByUUIDString(uuidStr)
	if err != nil {
		return fmt.Errorf("lookup domain: %w", err)
	}
	defer dom.Free()

	snap, err := dom.SnapshotLookupByName(snapshotName, 0)
	if err != nil {
		return fmt.Errorf("snapshot '%s' not found: %w", snapshotName, err)
	}
	defer snap.Free()

	// Revert to snapshot
	err = snap.RevertToSnapshot(0)
	if err != nil {
		return fmt.Errorf("revert to snapshot: %w", err)
	}

	return nil
}

// getSnapshotDetails is a helper to extract snapshot details from a libvirt snapshot object.
func (c *Client) getSnapshotDetails(snap *libvirt.DomainSnapshot) (core.Snapshot, error) {
	xmlDesc, err := snap.GetXMLDesc(0)
	if err != nil {
		return core.Snapshot{}, fmt.Errorf("get snapshot XML: %w", err)
	}

	// Unmarshal the snapshot XML to get details
	type snapshotXML struct {
		Name         string `xml:"name"`
		Description  string `xml:"description"`
		State        string `xml:"state"`
		CreationTime int64  `xml:"creationTime"`
	}
	var sx snapshotXML
	if err := xml.Unmarshal([]byte(xmlDesc), &sx); err != nil {
		return core.Snapshot{}, fmt.Errorf("unmarshal snapshot XML: %w", err)
	}

	return core.Snapshot{
		Name:        sx.Name,
		State:       sx.State,
		CreationTS:  sx.CreationTime,
		Description: sx.Description,
	}, nil
}
