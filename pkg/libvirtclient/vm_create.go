package libvirtclient

import (
	"encoding/xml"
	"fmt"
	"github.com/ccheshirecat/flint/pkg/core"
	libvirt "github.com/libvirt/libvirt-go"
	"os"
	"os/exec"
	"path/filepath"
)

// DomainXML defines the structure for marshalling a libvirt domain XML.
// This is a simplified version for v0.
type DomainXML struct {
	XMLName xml.Name `xml:"domain"`
	Type    string   `xml:"type,attr"`
	Name    string   `xml:"name"`
	Memory  struct {
		Unit  string `xml:"unit,attr"`
		Value uint64 `xml:",chardata"`
	} `xml:"memory"`
	VCPU struct {
		Placement string `xml:"placement,attr"`
		Value     int    `xml:",chardata"`
	} `xml:"vcpu"`
	OS struct {
		Type struct {
			Arch    string `xml:"arch,attr"`
			Machine string `xml:"machine,attr"`
			Value   string `xml:",chardata"`
		} `xml:"type"`
		Boot struct {
			Dev string `xml:"dev,attr"`
		} `xml:"boot"`
	} `xml:"os"`
	Devices struct {
		Emulator string `xml:"emulator"`
		Disks    []struct {
			Type   string `xml:"type,attr"`
			Device string `xml:"device,attr"`
			Driver struct {
				Name string `xml:"name,attr"`
				Type string `xml:"type,attr"`
			} `xml:"driver"`
			Source struct {
				Pool   string `xml:"pool,attr,omitempty"`
				Volume string `xml:"volume,attr,omitempty"`
				File   string `xml:"file,attr,omitempty"`
			} `xml:"source"`
			Target struct {
				Dev string `xml:"dev,attr"`
				Bus string `xml:"bus,attr"`
			} `xml:"target"`
		} `xml:"disk"`
		Interfaces []struct {
			Type   string `xml:"type,attr"`
			Source struct {
				Network string `xml:"network,attr"`
			} `xml:"source"`
			Model struct {
				Type string `xml:"type,attr"`
			} `xml:"model"`
		} `xml:"interface"`
		Graphics struct {
			Type     string `xml:"type,attr"`
			Port     int    `xml:"port,attr"`
			Autoport string `xml:"autoport,attr"`
			Listen   struct {
				Type string `xml:"type,attr"`
			} `xml:"listen"`
		} `xml:"graphics"`
		Serial struct {
			Type   string `xml:"type,attr"`
			Target struct {
				Type  string `xml:"type,attr"`
				Port  int    `xml:"port,attr"`
				Model struct {
					Name string `xml:"name,attr"`
				} `xml:"model"`
			} `xml:"target"`
		} `xml:"serial"`
		Console struct {
			Type   string `xml:"type,attr"`
			Target struct {
				Type string `xml:"type,attr"`
				Port int    `xml:"port,attr"`
			} `xml:"target"`
		} `xml:"console"`
	} `xml:"devices"`
}

// CreateVM orchestrates creating a new volume and defining the VM.
func (c *Client) CreateVM(cfg core.VMCreationConfig) (core.VM_Detailed, error) {
	// Step 1: Look up the source image from the managed library
	var sourcePath string
	if cfg.ImageName != "" {
		images, err := c.GetImages()
		if err != nil {
			return core.VM_Detailed{}, fmt.Errorf("failed to get images: %w", err)
		}

		for _, img := range images {
			if img.Name == cfg.ImageName {
				sourcePath = img.Path
				break
			}
		}

		if sourcePath == "" {
			return core.VM_Detailed{}, fmt.Errorf("image '%s' not found in managed library", cfg.ImageName)
		}
	}

	// Step 2: Create the main disk volume for the VM (if using template)
	var diskName string
	if cfg.ImageType == "template" && sourcePath != "" {
		diskName = fmt.Sprintf("%s-disk-0.qcow2", cfg.Name)
		volCfg := core.VolumeConfig{
			Name:   diskName,
			SizeGB: 20, // Default size, could be made configurable
		}
		if err := c.CreateVolume(flintImagePoolName, volCfg); err != nil {
			return core.VM_Detailed{}, fmt.Errorf("could not create vm disk volume: %w", err)
		}
	}

	// Step 3: Generate cloud-init user data if configured
	var userData string
	if cfg.CloudInit != nil {
		var err error
		userData, err = generateUserDataYAML(cfg.CloudInit)
		if err != nil {
			return core.VM_Detailed{}, fmt.Errorf("failed to generate cloud-init user data: %w", err)
		}
	}

	// Step 4: Build the Domain XML structure from the config.
	domain := buildDomainXML(cfg, diskName, sourcePath)

	// Step 5: Marshal the struct into an XML string.
	xmlBytes, err := xml.MarshalIndent(domain, "", "  ")
	if err != nil {
		// This should not happen with a valid struct, but handle it.
		// On failure, we should clean up the created disk.
		if diskName != "" {
			_ = c.deleteVolume(flintImagePoolName, diskName) // Best-effort cleanup
		}
		return core.VM_Detailed{}, fmt.Errorf("failed to marshal domain xml: %w", err)
	}
	xmlString := string(xmlBytes)

	// Step 6: Define the domain from the XML.
	dom, err := c.conn.DomainDefineXML(xmlString)
	if err != nil {
		if diskName != "" {
			_ = c.deleteVolume(flintImagePoolName, diskName) // Best-effort cleanup
		}
		return core.VM_Detailed{}, fmt.Errorf("failed to define domain from xml: %w", err)
	}
	defer dom.Free()

	// Step 7: If cloud-init is configured, create and attach cloud-init ISO
	if userData != "" {
		isoPath, err := createCloudInitISO(c.conn, userData, cfg.Name)
		if err != nil {
			// Log the error but don't fail the VM creation
			// Cloud-init is optional, so we can continue without it
			fmt.Printf("Warning: Failed to create cloud-init ISO: %v\n", err)
		} else {
			// Attach the cloud-init ISO as a CD-ROM
			if err := attachCloudInitISO(c.conn, dom, isoPath); err != nil {
				fmt.Printf("Warning: Failed to attach cloud-init ISO: %v\n", err)
			}
		}
	}

	// Step 8: Start the domain if requested.
	if cfg.StartOnCreate {
		if err := dom.Create(); err != nil {
			// Failed to start, but it's defined. Return the details anyway.
			// The user can try to start it manually.
		}
	}

	// Step 9: Return the details of the newly created VM.
	uuid, _ := dom.GetUUIDString()
	return c.GetVMDetails(uuid)
}

// buildDomainXML is a helper to translate our config into the XML struct.
func buildDomainXML(cfg core.VMCreationConfig, diskVolumeName string, sourcePath string) DomainXML {
	// A set of sensible defaults.
	d := DomainXML{
		Type: "kvm",
		Name: cfg.Name,
	}

	d.Memory.Unit = "MiB"
	d.Memory.Value = cfg.MemoryMB

	d.VCPU.Placement = "static"
	d.VCPU.Value = cfg.VCPUs

	d.OS.Type.Arch = "x86_64"
	d.OS.Type.Machine = "pc" // A modern machine type
	d.OS.Type.Value = "hvm"

	d.Devices.Emulator = "/usr/bin/qemu-system-x86_64"

	// --- Main OS Disk ---
	if cfg.ImageType == "template" && diskVolumeName != "" {
		// Use the created disk volume
		osDisk := struct {
			Type   string `xml:"type,attr"`
			Device string `xml:"device,attr"`
			Driver struct {
				Name string `xml:"name,attr"`
				Type string `xml:"type,attr"`
			} `xml:"driver"`
			Source struct {
				Pool   string `xml:"pool,attr,omitempty"`
				Volume string `xml:"volume,attr,omitempty"`
				File   string `xml:"file,attr,omitempty"`
			} `xml:"source"`
			Target struct {
				Dev string `xml:"dev,attr"`
				Bus string `xml:"bus,attr"`
			} `xml:"target"`
		}{
			Type:   "volume",
			Device: "disk",
			Driver: struct {
				Name string `xml:"name,attr"`
				Type string `xml:"type,attr"`
			}{Name: "qemu", Type: "qcow2"},
			Source: struct {
				Pool   string `xml:"pool,attr,omitempty"`
				Volume string `xml:"volume,attr,omitempty"`
				File   string `xml:"file,attr,omitempty"`
			}{Pool: flintImagePoolName, Volume: diskVolumeName},
			Target: struct {
				Dev string `xml:"dev,attr"`
				Bus string `xml:"bus,attr"`
			}{Dev: "vda", Bus: "virtio"},
		}
		d.Devices.Disks = append(d.Devices.Disks, osDisk)
		d.OS.Boot.Dev = "hd" // Boot from hard disk
	} else if cfg.ImageType == "iso" && sourcePath != "" {
		// Use ISO directly
		cdrom := struct {
			Type   string `xml:"type,attr"`
			Device string `xml:"device,attr"`
			Driver struct {
				Name string `xml:"name,attr"`
				Type string `xml:"type,attr"`
			} `xml:"driver"`
			Source struct {
				Pool   string `xml:"pool,attr,omitempty"`
				Volume string `xml:"volume,attr,omitempty"`
				File   string `xml:"file,attr,omitempty"`
			} `xml:"source"`
			Target struct {
				Dev string `xml:"dev,attr"`
				Bus string `xml:"bus,attr"`
			} `xml:"target"`
		}{
			Type:   "file",
			Device: "cdrom",
			Driver: struct {
				Name string `xml:"name,attr"`
				Type string `xml:"type,attr"`
			}{Name: "qemu", Type: "raw"},
			Source: struct {
				Pool   string `xml:"pool,attr,omitempty"`
				Volume string `xml:"volume,attr,omitempty"`
				File   string `xml:"file,attr,omitempty"`
			}{File: sourcePath},
			Target: struct {
				Dev string `xml:"dev,attr"`
				Bus string `xml:"bus,attr"`
			}{Dev: "sda", Bus: "sata"},
		}
		d.Devices.Disks = append(d.Devices.Disks, cdrom)
		d.OS.Boot.Dev = "cdrom" // Set boot order to CDROM
	}

	// --- Network Interface ---
	nic := struct {
		Type   string `xml:"type,attr"`
		Source struct {
			Network string `xml:"network,attr"`
		} `xml:"source"`
		Model struct {
			Type string `xml:"type,attr"`
		} `xml:"model"`
	}{
		Type: "network",
		Source: struct {
			Network string `xml:"network,attr"`
		}{Network: cfg.NetworkName},
		Model: struct {
			Type string `xml:"type,attr"`
		}{Type: "virtio"},
	}
	d.Devices.Interfaces = append(d.Devices.Interfaces, nic)

	// --- Default Graphics for Console Access ---
	d.Devices.Graphics.Type = "vnc"
	d.Devices.Graphics.Port = -1
	d.Devices.Graphics.Autoport = "yes"
	d.Devices.Graphics.Listen.Type = "address"

	// --- Serial Console (PTY) ---
	d.Devices.Serial.Type = "pty"
	d.Devices.Serial.Target.Type = "isa-serial"
	d.Devices.Serial.Target.Port = 0
	d.Devices.Serial.Target.Model.Name = "isa-serial"

	// --- Console (PTY) ---
	d.Devices.Console.Type = "pty"
	d.Devices.Console.Target.Type = "serial"
	d.Devices.Console.Target.Port = 0

	return d
}

// deleteVolume is a small helper for cleanup on failure.
func (c *Client) deleteVolume(poolName, volName string) error {
	pool, err := c.conn.LookupStoragePoolByName(poolName)
	if err != nil {
		return err
	}
	defer pool.Free()

	vol, err := pool.LookupStorageVolByName(volName)
	if err != nil {
		return err
	}
	defer vol.Free()

	return vol.Delete(0)
}

// createCloudInitISO creates a cloud-init ISO with the provided user data
func createCloudInitISO(conn *libvirt.Connect, userData, vmName string) (string, error) {
	// Create a temporary directory for cloud-init files
	tempDir, err := os.MkdirTemp("", "flint-cloudinit-")
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir) // Clean up temp directory

	// Write user data to file
	userDataPath := filepath.Join(tempDir, "user-data")
	if err := os.WriteFile(userDataPath, []byte(userData), 0644); err != nil {
		return "", fmt.Errorf("failed to write user data: %w", err)
	}

	// Create meta-data file (minimal)
	metaDataPath := filepath.Join(tempDir, "meta-data")
	metaData := fmt.Sprintf("instance-id: %s\nlocal-hostname: %s\n", vmName, vmName)
	if err := os.WriteFile(metaDataPath, []byte(metaData), 0644); err != nil {
		return "", fmt.Errorf("failed to write meta data: %w", err)
	}

	// Create ISO using genisoimage (common on Linux systems)
	isoPath := fmt.Sprintf("/tmp/%s-cloudinit.iso", vmName)
	cmd := exec.Command("genisoimage", "-output", isoPath, "-volid", "cidata", "-joliet", "-rock", tempDir)
	if err := cmd.Run(); err != nil {
		// Try mkisofs as an alternative
		cmd = exec.Command("mkisofs", "-output", isoPath, "-volid", "cidata", "-joliet", "-rock", tempDir)
		if err := cmd.Run(); err != nil {
			return "", fmt.Errorf("failed to create ISO (tried genisoimage and mkisofs): %w", err)
		}
	}

	return isoPath, nil
}

// attachCloudInitISO attaches the cloud-init ISO to the VM as a CD-ROM
func attachCloudInitISO(conn *libvirt.Connect, dom *libvirt.Domain, isoPath string) error {
	// Get the current domain XML
	xmlDesc, err := dom.GetXMLDesc(0)
	if err != nil {
		return fmt.Errorf("failed to get domain XML: %w", err)
	}

	// Parse the XML to add the cloud-init disk
	type DomainXML struct {
		XMLName xml.Name `xml:"domain"`
		Devices struct {
			Disks []struct {
				Type   string `xml:"type,attr"`
				Device string `xml:"device,attr"`
				Source struct {
					File string `xml:"file,attr"`
				} `xml:"source"`
				Target struct {
					Dev string `xml:"dev,attr"`
					Bus string `xml:"bus,attr"`
				} `xml:"target"`
			} `xml:"disk"`
		} `xml:"devices"`
	}

	var domain DomainXML
	if err := xml.Unmarshal([]byte(xmlDesc), &domain); err != nil {
		return fmt.Errorf("failed to parse domain XML: %w", err)
	}

	// Find the next available CD-ROM device
	cdromDevices := []string{"sda", "sdb", "sdc", "sdd"}
	usedDevices := make(map[string]bool)
	for _, disk := range domain.Devices.Disks {
		if disk.Device == "cdrom" {
			usedDevices[disk.Target.Dev] = true
		}
	}

	var nextDevice string
	for _, dev := range cdromDevices {
		if !usedDevices[dev] {
			nextDevice = dev
			break
		}
	}

	if nextDevice == "" {
		return fmt.Errorf("no available CD-ROM devices")
	}

	// Create the attachment XML
	attachXML := fmt.Sprintf(`<disk type="file" device="cdrom">
      <driver name="qemu" type="raw"/>
      <source file="%s"/>
      <target dev="%s" bus="sata"/>
      <readonly/>
    </disk>`, isoPath, nextDevice)

	// Attach the disk
	if err := dom.AttachDevice(attachXML); err != nil {
		return fmt.Errorf("failed to attach cloud-init ISO: %w", err)
	}

	return nil
}
