package cmd

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/ccheshirecat/flint/pkg/core"
	"github.com/ccheshirecat/flint/pkg/libvirtclient"
	"github.com/spf13/cobra"
)

var (
	vmName       string
	cloudInit    string
	vcpus        int
	memory       int
	diskSize     int
	network      string
	storagePool  string
	fromTemplate string
	sshKey       string
	username     string
	password     string
	staticIP     string
	gateway      string
	dns          string
)

var launchCmd = &cobra.Command{
	Use:   "launch [image-name]",
	Short: "Launch a new VM quickly",
	Long: `Launch a new VM with smart defaults. Examples:

  # Quick launch with auto-detected SSH key
  flint launch ubuntu-24.04 --name web-server

  # Launch with custom resources
  flint launch ubuntu-24.04 --name db-server --vcpus 4 --memory 8192

  # Launch from template
  flint launch --from my-template --name new-server

  # Launch with static IP
  flint launch ubuntu-24.04 --name api-server --static-ip 192.168.1.100 --gateway 192.168.1.1`,
	Args: func(cmd *cobra.Command, args []string) error {
		if fromTemplate == "" && len(args) == 0 {
			return fmt.Errorf("either specify an image name or use --from template")
		}
		return nil
	},
	Run: func(cmd *cobra.Command, args []string) {
		client, err := libvirtclient.NewClient("qemu:///system", "isos", "templates")
		if err != nil {
			log.Fatalf("Failed to connect to libvirt: %v", err)
		}
		defer client.Close()

		if fromTemplate != "" {
			launchFromTemplate(client)
		} else {
			launchFromImage(client, args[0])
		}
	},
}

func launchFromImage(client *libvirtclient.Client, imageName string) {
	// Auto-detect SSH key if not provided
	if sshKey == "" {
		sshKey = autoDetectSSHKey()
	}

	// Auto-generate VM name if not provided
	if vmName == "" {
		vmName = generateVMName(imageName)
	}

	// Build cloud-init config
	cloudInitConfig := buildCloudInitConfig()

	// Create VM configuration
	config := core.VMCreationConfig{
		Name:            vmName,
		MemoryMB:        uint64(memory),
		VCPUs:           vcpus,
		DiskPool:        storagePool,
		DiskSizeGB:      uint64(diskSize),
		ImageName:       imageName,
		ImageType:       "template", // Assume cloud image
		EnableCloudInit: true,
		CloudInit:       cloudInitConfig,
		StartOnCreate:   true,
		NetworkName:     network,
	}

	fmt.Printf("🚀 Launching VM '%s' from image '%s'...\n", vmName, imageName)
	fmt.Printf("   Resources: %d vCPUs, %dMB RAM, %dGB disk\n", vcpus, memory, diskSize)
	if sshKey != "" {
		fmt.Printf("   SSH: Key injected for user '%s'\n", username)
	}

	vm, err := client.CreateVM(config)
	if err != nil {
		log.Fatalf("Failed to create VM: %v", err)
	}

	fmt.Printf("✅ VM created successfully!\n")
	fmt.Printf("   UUID: %s\n", vm.UUID)
	fmt.Printf("   Status: %s\n", vm.State)
	fmt.Printf("\n💡 Next steps:\n")
	fmt.Printf("   Watch console: flint console %s\n", vmName)
	if sshKey != "" {
		fmt.Printf("   SSH when ready: flint ssh %s\n", vmName)
	}
}

func launchFromTemplate(client *libvirtclient.Client) {
	fmt.Printf("🚀 Launching VM '%s' from template '%s'...\n", vmName, fromTemplate)
	
	// Get template snapshots to find the specified template
	snapshots, err := client.GetVMSnapshots(fromTemplate)
	if err != nil {
		log.Fatalf("Failed to get template snapshots: %v", err)
	}

	if len(snapshots) == 0 {
		log.Fatalf("No snapshots found for template '%s'", fromTemplate)
	}

	// Use the latest snapshot
	latestSnapshot := snapshots[0]
	fmt.Printf("   Using snapshot: %s\n", latestSnapshot.Name)

	// Revert to snapshot to create a new VM
	err = client.RevertToVMSnapshot(fromTemplate, latestSnapshot.Name)
	if err != nil {
		log.Fatalf("Failed to revert to snapshot: %v", err)
	}

	fmt.Printf("✅ VM '%s' created from template '%s'!\n", vmName, fromTemplate)
}

func buildCloudInitConfig() *core.CloudInitConfig {
	networkConfig := &core.CloudInitNetworkConfig{
		UseDHCP: staticIP == "",
	}

	if staticIP != "" {
		networkConfig.IPAddress = staticIP
		networkConfig.Gateway = gateway
		networkConfig.Prefix = 24 // Default CIDR
		if dns != "" {
			networkConfig.DNSServers = strings.Split(dns, ",")
		}
	}

	config := &core.CloudInitConfig{
		CommonFields: core.CloudInitCommonFields{
			Hostname:      vmName,
			Username:      username,
			Password:      password,
			SSHKeys:       sshKey,
			NetworkConfig: networkConfig,
		},
	}

	return config
}

func autoDetectSSHKey() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ""
	}

	keyPaths := []string{
		filepath.Join(homeDir, ".ssh", "id_rsa.pub"),
		filepath.Join(homeDir, ".ssh", "id_ed25519.pub"),
		filepath.Join(homeDir, ".ssh", "id_ecdsa.pub"),
	}

	for _, keyPath := range keyPaths {
		if data, err := os.ReadFile(keyPath); err == nil {
			fmt.Printf("🔑 Auto-detected SSH key: %s\n", keyPath)
			return strings.TrimSpace(string(data))
		}
	}

	return ""
}

func generateVMName(imageName string) string {
	// Extract base name from image (e.g., "ubuntu-24.04" -> "ubuntu")
	parts := strings.Split(imageName, "-")
	base := parts[0]
	
	// Add random suffix
	return fmt.Sprintf("%s-%d", base, os.Getpid()%10000)
}

func init() {
	launchCmd.Flags().StringVar(&vmName, "name", "", "VM name (auto-generated if not specified)")
	launchCmd.Flags().StringVar(&cloudInit, "cloud-init", "", "Path to cloud-init YAML file")
	launchCmd.Flags().IntVar(&vcpus, "vcpus", 2, "Number of vCPUs")
	launchCmd.Flags().IntVar(&memory, "memory", 4096, "Memory in MB")
	launchCmd.Flags().IntVar(&diskSize, "disk", 20, "Disk size in GB")
	launchCmd.Flags().StringVar(&network, "network", "default", "Network name")
	launchCmd.Flags().StringVar(&storagePool, "pool", "default", "Storage pool name")
	launchCmd.Flags().StringVar(&fromTemplate, "from", "", "Launch from template")
	launchCmd.Flags().StringVar(&sshKey, "ssh-key", "", "SSH public key (auto-detected if not specified)")
	launchCmd.Flags().StringVar(&username, "user", "ubuntu", "Default username")
	launchCmd.Flags().StringVar(&password, "password", "", "Default password")
	launchCmd.Flags().StringVar(&staticIP, "static-ip", "", "Static IP address")
	launchCmd.Flags().StringVar(&gateway, "gateway", "", "Gateway IP (required with --static-ip)")
	launchCmd.Flags().StringVar(&dns, "dns", "8.8.8.8,1.1.1.1", "DNS servers (comma-separated)")
}