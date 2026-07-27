import type {
  AuthResponse,
  InvestigationResponse,
  InvestigationSummary,
  User,
} from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'truthlens_token'

export function getToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const detail =
      body && typeof body === 'object' && 'detail' in body ? body.detail : null
    const message =
      typeof detail === 'string' ? detail : `Request failed with status ${response.status}.`
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return parseJsonOrThrow<AuthResponse>(response)
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return parseJsonOrThrow<AuthResponse>(response)
}

export async function getMe(): Promise<User> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: authHeaders(),
  })

  return parseJsonOrThrow<User>(response)
}

export async function getInvestigation(id: string): Promise<InvestigationResponse> {
  const response = await fetch(`${API_URL}/api/investigations/${id}`)
  return parseJsonOrThrow<InvestigationResponse>(response)
}

export async function listMyInvestigations(): Promise<InvestigationSummary[]> {
  const response = await fetch(`${API_URL}/api/investigations/mine`, {
    headers: authHeaders(),
  })

  return parseJsonOrThrow<InvestigationSummary[]>(response)
}

export interface InvestigationProgress {
  step: string
  message: string
  progress: number
}

interface StreamCallbacks {
  onProgress: (progress: InvestigationProgress) => void
  onResult: (result: InvestigationResponse) => void
}

export async function investigateClaimStream(
  claim: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/investigate-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...authHeaders(),
    },
    body: JSON.stringify({
      claim,
      research_effort: 'lite',
    }),
  })

  if (!response.ok) {
    throw new Error(`Investigation failed with status ${response.status}.`)
  }

  if (!response.body) {
    throw new Error('Streaming response is unavailable.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    const eventBlocks = buffer.split('\n\n')
    buffer = eventBlocks.pop() ?? ''

    for (const block of eventBlocks) {
      if (!block.trim()) {
        continue
      }

      let eventName = ''
      let eventData = ''

      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim()
        }

        if (line.startsWith('data:')) {
          eventData += line.slice(5).trim()
        }
      }

      if (!eventData) {
        continue
      }

      const parsedData = JSON.parse(eventData)

      if (eventName === 'progress') {
        callbacks.onProgress(parsedData as InvestigationProgress)
      }

      if (eventName === 'result') {
        callbacks.onResult(parsedData as InvestigationResponse)
      }

      if (eventName === 'error') {
        const message =
          typeof parsedData.message === 'string'
            ? parsedData.message
            : 'Investigation failed.'

        throw new Error(message)
      }
    }
  }
}
