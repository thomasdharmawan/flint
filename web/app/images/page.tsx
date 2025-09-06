import { PageLayout } from "@/components/shared/page-layout"
import { ImagesView } from "@/components/images-view"

export default function ImagesPage() {
  return (
    <PageLayout title="Images" description="Manage virtual machine images and templates">
      <ImagesView />
    </PageLayout>
  )
}