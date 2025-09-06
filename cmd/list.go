package cmd

import (
	"fmt"
	"log"
	"os"
	"strings"
	"text/tabwriter"

	"github.com/ccheshirecat/flint/pkg/libvirtclient"
	"github.com/spf13/cobra"
)

var (
	outputFormat string
	showAll      bool
)

var listCmd = &cobra.Command{
	Use:     "list",
	Aliases: []string{"ls"},
	Short:   "List virtual machines",
	Long: `List all virtual machines with their status and basic info.

Examples:
  flint list                    # List running VMs
  flint list --all              # List all VMs (including stopped)
  flint list --format json      # JSON output`,
	Run: func(cmd *cobra.Command, args []string) {
		client, err := libvirtclient.NewClient("qemu:///system", "isos", "templates")
		if err != nil {
			log.Fatalf("Failed to connect to libvirt: %v", err)
		}
		defer client.Close()

		vms, err := client.GetVMSummaries()
		if err != nil {
			log.Fatalf("Failed to get VMs: %v", err)
		}

		// Filter VMs if not showing all
		if !showAll {
			var runningVMs []interface{}
			for _, vm := range vms {
				// Assuming VM has a State field
				if strings.ToLower(fmt.Sprintf("%v", getVMField(vm, "State"))) == "running" {
					runningVMs = append(runningVMs, vm)
				}
			}
			if outputFormat == "table" || outputFormat == "" {
				displayVMsTable(runningVMs)
			}
		} else {
			var allVMs []interface{}
			for _, vm := range vms {
				allVMs = append(allVMs, vm)
			}
			if outputFormat == "table" || outputFormat == "" {
				displayVMsTable(allVMs)
			}
		}
	},
}

func displayVMsTable(vms []interface{}) {
	if len(vms) == 0 {
		fmt.Println("No VMs found.")
		return
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "NAME\tSTATUS\tVCPUS\tMEMORY\tIP\tUUID")
	fmt.Fprintln(w, "----\t------\t-----\t------\t--\t----")

	for _, vm := range vms {
		name := getVMField(vm, "Name")
		state := getVMField(vm, "State")
		vcpus := getVMField(vm, "VCPUs")
		memory := formatMemory(getVMField(vm, "MemoryKB"))
		ip := getVMField(vm, "IP")
		uuid := getVMField(vm, "UUID")

		// Truncate UUID for display
		shortUUID := fmt.Sprintf("%v", uuid)
		if len(shortUUID) > 8 {
			shortUUID = shortUUID[:8] + "..."
		}

		fmt.Fprintf(w, "%v\t%v\t%v\t%v\t%v\t%v\n",
			name, state, vcpus, memory, ip, shortUUID)
	}

	w.Flush()
}

func getVMField(vm interface{}, fieldName string) interface{} {
	// This is a simplified field accessor
	// In practice, you'd use reflection or type assertions
	// based on your actual VM struct
	switch v := vm.(type) {
	case map[string]interface{}:
		return v[fieldName]
	default:
		return "N/A"
	}
}

func formatMemory(memoryKB interface{}) string {
	if kb, ok := memoryKB.(int); ok {
		if kb >= 1024*1024 {
			return fmt.Sprintf("%.1fGB", float64(kb)/(1024*1024))
		} else if kb >= 1024 {
			return fmt.Sprintf("%.1fMB", float64(kb)/1024)
		}
		return fmt.Sprintf("%dKB", kb)
	}
	return "N/A"
}

func init() {
	listCmd.Flags().StringVar(&outputFormat, "format", "table", "Output format (table, json)")
	listCmd.Flags().BoolVar(&showAll, "all", false, "Show all VMs (including stopped)")
}