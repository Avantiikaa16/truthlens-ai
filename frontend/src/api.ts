import type { InvestigationResponse } from './types'

const API_URL = 'http://localhost:8000'

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