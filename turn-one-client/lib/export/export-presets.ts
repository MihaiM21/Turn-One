import type {
  CreateExportPresetInput,
  ExportPreset,
  ExportSessionType,
  UpdateExportPresetInput,
} from "@/types/export-types"

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend.t1f1.com/api"

const getToken = () => {
  if (typeof window !== "undefined") return localStorage.getItem("token")
  return null
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const json = (await res.json()) as ApiEnvelope<T>
  if (!json.success || json.data === undefined) {
    throw new Error(json.message || json.error || "Request unsuccessful")
  }
  return json.data
}

export async function listPresets(sessionType?: ExportSessionType): Promise<ExportPreset[]> {
  const qs = sessionType ? `?sessionType=${sessionType}` : ""
  return request<ExportPreset[]>(`/export-presets${qs}`)
}

export async function createPreset(input: CreateExportPresetInput): Promise<ExportPreset> {
  return request<ExportPreset>(`/export-presets`, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      sessionType: input.sessionType,
      chartKeys: input.chartKeys,
      outputSizes: input.outputSizes,
    }),
  })
}

export async function updatePreset(id: string, input: UpdateExportPresetInput): Promise<ExportPreset> {
  return request<ExportPreset>(`/export-presets/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export async function deletePreset(id: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${API_URL}/export-presets/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: token } : undefined,
  })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}
