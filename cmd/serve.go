package cmd

import (
	"github.com/ccheshirecat/flint/pkg/libvirtclient"
	"github.com/ccheshirecat/flint/server"
	"github.com/spf13/cobra"
	"log"
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the flint web server",
	Run: func(cmd *cobra.Command, args []string) {
		// 1. Create the core libvirt client
		client, err := libvirtclient.NewClient("qemu:///system", "isos", "templates")
		if err != nil {
			log.Fatalf("Failed to connect to libvirt: %v", err)
		}
		defer client.Close()

		// 2. Start the HTTP server, passing the client to it
		apiServer := server.NewServer(client, globalAssets)
		log.Println("Starting flint API server on :5550...")
		if err := apiServer.Start(":5550"); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)
	// Add flags specific to the server, e.g., --port
}
