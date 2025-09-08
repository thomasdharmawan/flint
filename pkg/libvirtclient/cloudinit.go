package libvirtclient

import (
	"fmt"
	"github.com/ccheshirecat/flint/pkg/core"
	"strings"
)

// generateUserDataYAML generates cloud-init user data YAML from config
func generateUserDataYAML(cfg *core.CloudInitConfig) (string, error) {
	if cfg == nil {
		return "", nil
	}

	// If raw user data is provided, use it directly
	if cfg.RawUserData != "" {
		return cfg.RawUserData, nil
	}

	// Generate YAML from common fields
	var yaml strings.Builder
	yaml.WriteString("#cloud-config\n")

	if cfg.CommonFields.Hostname != "" {
		yaml.WriteString(fmt.Sprintf("hostname: %s\n", cfg.CommonFields.Hostname))
	}

	// Create default user if username is provided
	if cfg.CommonFields.Username != "" {
		yaml.WriteString("users:\n")
		yaml.WriteString(fmt.Sprintf("  - name: %s\n", cfg.CommonFields.Username))
		yaml.WriteString("    sudo: ALL=(ALL) NOPASSWD:ALL\n")
		yaml.WriteString("    groups: users, admin\n")
		yaml.WriteString("    shell: /bin/bash\n")
		yaml.WriteString("    lock_passwd: false\n")
		yaml.WriteString("    lock_passwd: false\n")
	}

	// Set password using chpasswd (works with plain text)
	if cfg.CommonFields.Password != "" && cfg.CommonFields.Username != "" {
		yaml.WriteString("chpasswd:\n")
		yaml.WriteString("  list: |\n")
		yaml.WriteString(fmt.Sprintf("    %s:%s\n", cfg.CommonFields.Username, cfg.CommonFields.Password))
		yaml.WriteString("  expire: false\n")
	} else if cfg.CommonFields.Password != "" {
		// Set password for default user if no custom username
		yaml.WriteString(fmt.Sprintf("password: %s\n", cfg.CommonFields.Password))
		yaml.WriteString("chpasswd:\n")
		yaml.WriteString("  expire: false\n")
		yaml.WriteString("ssh_pwauth: true\n")
	}

	if cfg.CommonFields.SSHKeys != "" {
		yaml.WriteString("ssh_authorized_keys:\n")
		// Split keys by newline and add each one
		keys := strings.Split(strings.TrimSpace(cfg.CommonFields.SSHKeys), "\n")
		for _, key := range keys {
			key = strings.TrimSpace(key)
			if key != "" {
				yaml.WriteString(fmt.Sprintf("  - %s\n", key))
			}
		}
	}

	// Add network configuration
	if cfg.CommonFields.NetworkConfig != nil {
		yaml.WriteString("network:\n")
		yaml.WriteString("  version: 2\n")
		yaml.WriteString("  ethernets:\n")
		yaml.WriteString("    ens3:\n") // Default interface name for cloud-init
		if cfg.CommonFields.NetworkConfig.UseDHCP {
			yaml.WriteString("      dhcp4: true\n")
		} else {
			yaml.WriteString("      dhcp4: false\n")
			if cfg.CommonFields.NetworkConfig.IPAddress != "" {
				yaml.WriteString(fmt.Sprintf("      addresses: [%s/%d]\n", cfg.CommonFields.NetworkConfig.IPAddress, cfg.CommonFields.NetworkConfig.Prefix))
			}
			if cfg.CommonFields.NetworkConfig.Gateway != "" {
				yaml.WriteString(fmt.Sprintf("      gateway4: %s\n", cfg.CommonFields.NetworkConfig.Gateway))
			}
			if len(cfg.CommonFields.NetworkConfig.DNSServers) > 0 {
				yaml.WriteString("      nameservers:\n")
				yaml.WriteString("        addresses:\n")
				for _, dns := range cfg.CommonFields.NetworkConfig.DNSServers {
					yaml.WriteString(fmt.Sprintf("          - %s\n", dns))
				}
			}
		}
	}

	return yaml.String(), nil
}
