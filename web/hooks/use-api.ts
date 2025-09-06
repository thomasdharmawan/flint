import useSWR from "swr"
import { hostAPI, vmAPI, storageAPI, type VMDetailed } from "@/lib/api"

// Host hooks
export function useHostStatus() {
  return useSWR("host-status", hostAPI.getStatus, {
    refreshInterval: 5000, // Refresh every 5 seconds
    revalidateOnFocus: true,
  })
}

export function useHostResources() {
  return useSWR("host-resources", hostAPI.getResources, {
    refreshInterval: 10000, // Refresh every 10 seconds
    revalidateOnFocus: true,
  })
}

// VM hooks
export function useVMs() {
  return useSWR("vms", vmAPI.getAll, {
    refreshInterval: 3000, // Refresh every 3 seconds for VM list
    revalidateOnFocus: true,
  })
}

export function useVM(uuid: string | null) {
  return useSWR(uuid ? `vm-${uuid}` : null, () => (uuid ? vmAPI.getById(uuid) : null), {
    refreshInterval: 2000, // Refresh every 2 seconds for individual VM
    revalidateOnFocus: true,
  })
}

// Storage hooks
export function useStoragePools() {
  return useSWR("storage-pools", storageAPI.getPools, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  })
}

export function useVolumes(poolName: string | null) {
  return useSWR(poolName ? `volumes-${poolName}` : null, () => (poolName ? storageAPI.getVolumes(poolName) : null), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })
}

// Utility hook for mutations with optimistic updates
export function useApiMutation() {
  const { mutate } = useSWR(null) // Get the global mutate function

  const performVMAction = async (uuid: string, action: string) => {
    try {
      // Skip optimistic update for now - SWR version compatibility issue

      // Perform the actual API call
      const result = await vmAPI.performAction(uuid, { action: action as any })

      // Revalidate the data
      await mutate(`vm-${uuid}`)
      await mutate("vms")

      return result
    } catch (error) {
      // Revert optimistic update on error
      await mutate(`vm-${uuid}`)
      throw error
    }
  }

  const deleteVM = async (uuid: string, deleteDisks = false) => {
    try {
      await vmAPI.delete(uuid, deleteDisks)
      // Remove from cache and revalidate
      await mutate("vms")
      await mutate(`vm-${uuid}`)
    } catch (error) {
      throw error
    }
  }

  const createVM = async (config: any) => {
    try {
      const result = await vmAPI.create(config)
      // Revalidate VM list
      await mutate("vms")
      return result
    } catch (error) {
      throw error
    }
  }

  return {
    performVMAction,
    deleteVM,
    createVM,
  }
}
