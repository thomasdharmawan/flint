import { AppShell } from "@/components/app-shell"
import { VirtualMachineListView } from "@/components/virtual-machine-list-view"

export default function VirtualMachinesPage() {
  return (
    <AppShell>
      <VirtualMachineListView />
    </AppShell>
  )
}
