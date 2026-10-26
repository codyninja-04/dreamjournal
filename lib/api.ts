// Tiny fetch wrapper for client components. Throws with the server's message so
// the UI can show it as is.
export async function postJson<T = unknown>(url: string, body: unknown, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Something went wrong. Try again.')
  return data as T
}
