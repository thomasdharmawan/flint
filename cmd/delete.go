package cmd

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/ccheshirecat/flint/pkg/libvirtclient"
	"github.com/spf13/cobra"
)

var (
	force       bool
	deleteDisks bool
)

var deleteCmd = &cobra.Command{
	Use:   "delete [vm-name]",
	Short: "Delete a virtual machine",
	Long: `Delete a virtual machine and optionally its disks.

Examples:
  flint delete web-server                    # Delete VM (keep disks)
  flint delete web-server --disks           # Delete VM and disks
  flint delete web-server --force           # Skip confirmation`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		vmIdentifier := args[0]

		client, err := libvirtclient.NewClient("qemu:///system", "isos", "templates")
		if err != nil {
			log.Fatalf("Failed to connect to libvirt: %v", err)
		}
		defer client.Close()

		// Find VM
		vm, err := findVMByIdentifier(client, vmIdentifier)
		if err != nil {
			log.Fatalf("Failed to find VM: %v", err)
		}

		// Confirmation prompt
		if !force {
			fmt.Printf("⚠️  Are you sure you want to delete VM '%s'", vm.Name)
			if deleteDisks {
				fmt.Printf(" and its disks")
			}
			fmt.Printf("? (y/N): ")

			reader := bufio.NewReader(os.Stdin)
			response, err := reader.ReadString('\n')
			if err != nil {
				log.Fatalf("Failed to read input: %v", err)
			}

			response = strings.ToLower(strings.TrimSpace(response))
			if response != "y" && response != "yes" {
				fmt.Println("❌ Deletion cancelled")
				return
			}
		}

		fmt.Printf("🗑️  Deleting VM '%s'", vm.Name)
		if deleteDisks {
			fmt.Printf(" and its disks")
		}
		fmt.Println("...")

		err = client.DeleteVM(vm.UUID, deleteDisks)
		if err != nil {
			log.Fatalf("Failed to delete VM: %v", err)
		}

		fmt.Printf("✅ VM '%s' deleted successfully!\n", vm.Name)
	},
}

func init() {
	deleteCmd.Flags().BoolVar(&force, "force", false, "Skip confirmation prompt")
	deleteCmd.Flags().BoolVar(&deleteDisks, "disks", false, "Also delete VM disks")
}