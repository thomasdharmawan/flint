package cmd

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/ccheshirecat/flint/pkg/libvirtclient"
	"github.com/spf13/cobra"
)

var consoleCmd = &cobra.Command{
	Use:   "console [vm-name]",
	Short: "Connect to VM serial console",
	Long: `Connect to the serial console of a virtual machine.

Examples:
  flint console web-server       # Connect to console
  flint console web-server --tail # Show recent output and follow`,
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

		// Get console path
		consolePath, err := client.GetVMSerialConsolePath(vm.UUID)
		if err != nil {
			log.Fatalf("Failed to get console path: %v", err)
		}

		fmt.Printf("🖥️  Connecting to console for '%s'...\n", vm.Name)
		fmt.Println("   Press Ctrl+] to disconnect")
		fmt.Println()

		// Connect to Unix socket
		conn, err := net.Dial("unix", consolePath)
		if err != nil {
			log.Fatalf("Failed to connect to console: %v", err)
		}
		defer conn.Close()

		// Handle Ctrl+C gracefully
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, syscall.SIGTERM)
		go func() {
			<-c
			fmt.Println("\n🚪 Disconnecting from console...")
			conn.Close()
			os.Exit(0)
		}()

		// Start reading from console
		go func() {
			scanner := bufio.NewScanner(conn)
			for scanner.Scan() {
				fmt.Println(scanner.Text())
			}
		}()

		// Read from stdin and send to console
		scanner := bufio.NewScanner(os.Stdin)
		for scanner.Scan() {
			line := scanner.Text()
			
			// Check for disconnect sequence
			if line == "\x1D" { // Ctrl+]
				fmt.Println("🚪 Disconnecting from console...")
				break
			}
			
			_, err := conn.Write([]byte(line + "\n"))
			if err != nil {
				log.Printf("Failed to write to console: %v", err)
				break
			}
		}
	},
}