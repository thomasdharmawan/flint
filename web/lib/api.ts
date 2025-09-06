export interface HealthCheck {
  type: string
  message: string
}

export interface HostStatus {
  hostname: string
  hypervisor_version: string
  total_vms: number
  running_vms: number
  paused_vms: number
  shutoff_vms: number
  health_checks: HealthCheck[]
}

export interface HostResources {
  total_memory_kb: number
  free_memory_kb: number
  cpu_cores: number
  storage_total_b: number
  storage_used_b: number
  active_interfaces: number
}

export interface PerformanceDataPoint {
  timestamp: string
  cpu: number
  memory: number
  disk: number
}

export interface VMSummary {
  name: string
  uuid: string
  state: string
  memory_kb: number
  max_memory_kb: number
  vcpus: number
  cpu_percent: number
  uptime_sec: number
  os_info: string
  ip_addresses: string[]
}

export interface Disk {
  source_path: string
  target_dev: string
  device: string
}

export interface NIC {
  mac: string
  source: string
  model: string
}

export interface VMDetailed extends VMSummary {
  xml: string
  disks: Disk[]
  nics: NIC[]
  os: string
}

export interface StoragePool {
  name: string
  capacity_b: number
  allocation_b: number
}

export interface Volume {
  name: string
  path: string
  capacity_b: number
}

export interface VMCreationConfig {
  Name: string
  MemoryMB: number
  VCPUs: number
  DiskPool: string
  DiskSizeGB: number
  ISOPath: string
  StartOnCreate: boolean
  NetworkName: string
}

export interface VolumeConfig {
  Name: string
  SizeGB: number
}

export interface VMAction {
  action: "start" | "stop" | "reboot" | "force-stop" | "pause" | "resume"
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:5550/api`
    : "http://localhost:5550/api")


class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "APIError"
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage
    }
    throw new APIError(response.status, errorMessage)
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// Host API functions
export const hostAPI = {
  getStatus: (): Promise<HostStatus> => apiRequest("/host/status"),
  getResources: (): Promise<HostResources> => apiRequest("/host/resources"),
  getPerformance: (): Promise<PerformanceDataPoint[]> => apiRequest("/host/performance"),
}

// VM API functions
export const vmAPI = {
  getAll: (): Promise<VMSummary[]> => apiRequest("/vms"),
  getById: (uuid: string): Promise<VMDetailed> => apiRequest(`/vms/${uuid}`),
  create: (config: VMCreationConfig): Promise<VMDetailed> =>
    apiRequest("/vms", {
      method: "POST",
      body: JSON.stringify(config),
    }),
  performAction: (uuid: string, action: VMAction): Promise<{ message: string }> =>
    apiRequest(`/vms/${uuid}/action`, {
      method: "POST",
      body: JSON.stringify(action),
    }),
  delete: (uuid: string, deleteDisks = false): Promise<void> => {
    const url = deleteDisks ? `/vms/${uuid}?deleteDisks=true` : `/vms/${uuid}`
    return apiRequest(url, { method: "DELETE" })
  },
}

// Storage API functions
export const storageAPI = {
  getPools: (): Promise<StoragePool[]> => apiRequest("/storage-pools"),
  getVolumes: (poolName: string): Promise<Volume[]> => apiRequest(`/storage-pools/${poolName}/volumes`),
  createVolume: (poolName: string, config: VolumeConfig): Promise<Volume> =>
    apiRequest(`/storage-pools/${poolName}/volumes`, {
      method: "POST",
      body: JSON.stringify(config),
    }),
}

// Network API types
export interface VirtualNetwork {
  name: string
  type: string
  state: string
  bridge: string
  ipRange: string
  dhcp: {
    enabled: boolean
    start?: string
    end?: string
  }
  connectedVMs: number
  autostart: boolean
}

export interface NetworkInterface {
  name: string
  type: string
  state: string
  mac: string
  ip: string
  speed: string
  bridge?: string
}

export interface VMNetworkConnection {
  vm: string
  network: string
  interface: string
  mac: string
  ip: string
  state: string
}

// Network API functions
export const networkAPI = {
  getNetworks: (): Promise<VirtualNetwork[]> => apiRequest("/networks"),
  getNetwork: (name: string): Promise<VirtualNetwork> => apiRequest(`/networks/${name}`),
  getInterfaces: (): Promise<NetworkInterface[]> => apiRequest("/interfaces"),
  getVMConnections: (): Promise<VMNetworkConnection[]> => apiRequest("/vm-connections"),
  createNetwork: (name: string, bridgeName: string): Promise<void> => 
    apiRequest("/networks", {
      method: "POST",
      body: JSON.stringify({ name, bridgeName }),
    }),
}

// Image API types
export interface Image {
  id: string
  name: string
  type: "iso" | "template"
  pool: string
  path: string
  size_b: number
  format?: string
  os_info?: string
  description?: string
  created_at?: string
  status?: "available" | "uploading" | "downloading" | "error"
}

export interface ImageImportRequest {
  path: string
}

export interface ImageDownloadRequest {
  url: string
  name?: string
}

// Image API functions
export const imageAPI = {
  getAll: (): Promise<Image[]> => apiRequest("/images"),
  importFromPath: (request: ImageImportRequest): Promise<Image> =>
    apiRequest("/images/import-from-path", {
      method: "POST",
      body: JSON.stringify(request),
    }),
  upload: (file: File): Promise<Image> => {
    const formData = new FormData()
    formData.append("file", file)
    return apiRequest("/images/upload", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    })
  },
  download: (request: ImageDownloadRequest): Promise<Image> =>
    apiRequest("/images/download", {
      method: "POST",
      body: JSON.stringify(request),
    }),
  delete: (id: string): Promise<void> => apiRequest(`/images/${id}`, { method: "DELETE" }),
}
