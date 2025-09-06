package cmd

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"

	"github.com/ccheshirecat/flint/pkg/libvirtclient"
	"github.com/spf13/cobra"
)

var (
	sshUser    string
	sshCommand string
	copyOnly   bool
)

var sshCmd = &cobra.Command{
	Use:   "ssh [vm-name]",
	Short: "SSH into a virtual machine",
	Long: `SSH into a virtual machine by name or UUID.

Examples:
  flint ssh web-server           # SSH as default user
  flint ssh web-server --user root
  flint ssh web-server --copy    # Copy SSH command to clipboard
  flint ssh web-server --command "systemctl status nginx"`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		vmIdentifier := args[0]

		client, err := libvirtclient.NewClient("qemu:///system", "isos", "templates")
		if err != nil {
			log.Fatalf("Failed to connect to libvirt: %v", err)
		}
		defer client.Close()

		// Find VM by name or UUID
		vm, err := findVMByIdentifier(client, vmIdentifier)
		if err != nil {
			log.Fatalf("Failed to find VM: %v", err)
		}

		// Get VM IP address
		vmDetails, err := client.GetVMDetails(vm.UUID)
		if err != nil {
			log.Fatalf("Failed to get VM details: %v", err)
		}

		// Get first IP address if available
		var vmIP string
		if len(vmDetails.IPAddresses) > 0 {
			vmIP = vmDetails.IPAddresses[0]
		}
		
		if vmIP == "" {
			log.Fatalf("VM '%s' has no IP address. Is it running?", vmIdentifier)
		}

		// Build SSH command
		sshArgs := []string{fmt.Sprintf("%s@%s", sshUser, vmIP)}
		
		if sshCommand != "" {
			sshArgs = append(sshArgs, sshCommand)
		}

		fullCommand := fmt.Sprintf("ssh %s", strings.Join(sshArgs, " "))

		if copyOnly {
			// Copy to clipboard (platform-specific)
			if err := copyToClipboard(fullCommand); err != nil {
				fmt.Printf("SSH command: %s\n", fullCommand)
				fmt.Println("(Failed to copy to clipboard)")
			} else {
				fmt.Printf("✅ SSH command copied to clipboard: %s\n", fullCommand)
			}
			return
		}

		// Execute SSH command
		fmt.Printf("🔗 Connecting to %s (%s)...\n", vm.Name, vmIP)
		
		sshCmd := exec.Command("ssh", sshArgs...)
		sshCmd.Stdin = os.Stdin
		sshCmd.Stdout = os.Stdout
		sshCmd.Stderr = os.Stderr

		if err := sshCmd.Run(); err != nil {
			log.Fatalf("SSH failed: %v", err)
		}
	},
}

func findVMByIdentifier(client *libvirtclient.Client, identifier string) (*struct{ Name, UUID string }, error) {
	vms, err := client.GetVMSummaries()
	if err != nil {
		return nil, err
	}

	for _, vm := range vms {
		// This is simplified - you'd need to adapt based on your actual VM struct
		name := fmt.Sprintf("%v", getVMField(vm, "Name"))
		uuid := fmt.Sprintf("%v", getVMField(vm, "UUID"))
		
		if name == identifier || uuid == identifier || strings.HasPrefix(uuid, identifier) {
			return &struct{ Name, UUID string }{name, uuid}, nil
		}
	}

	return nil, fmt.Errorf("VM '%s' not found", identifier)
}

func copyToClipboard(text string) error {
	// Try different clipboard commands based on platform
	commands := [][]string{
		{"pbcopy"},                    // macOS
		{"xclip", "-selection", "clipboard"}, // Linux with xclip
		{"xsel", "--clipboard", "--input"},   // Linux with xsel
	}

	for _, cmdArgs := range commands {
		if _, err := exec.LookPath(cmdArgs[0]); err == nil {
			cmd := exec.Command(cmdArgs[0], cmdArgs[1:]...)
			cmd.Stdin = strings.NewReader(text)
			return cmd.Run()
		}
	}

	return fmt.Errorf("no clipboard utility found")
}

func init() {
	sshCmd.Flags().StringVar(&sshUser, "user", "ubuntu", "SSH username")
	sshCmd.Flags().StringVar(&sshCommand, "command", "", "Command to execute via SSH")
	sshCmd.Flags().BoolVar(&copyOnly, "copy", false, "Copy SSH command to clipboard instead of executing")
}