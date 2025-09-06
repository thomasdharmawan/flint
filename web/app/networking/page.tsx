import { PageLayout } from "@/components/shared/page-layout"
import { NetworkingView } from "@/components/networking-view"

export default function NetworkingPage() {
  return (
    <PageLayout title="Networking" description="Manage virtual networks and network interfaces">
      <NetworkingView />
    </PageLayout>
  )
}
