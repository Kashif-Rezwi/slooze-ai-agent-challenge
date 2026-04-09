import type { UploadResponse } from '@slooze/shared'

const API_BASE = '/api'

export async function uploadPdf(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Upload failed: ${res.status}`)
  }
  return res.json() as Promise<UploadResponse>
}
