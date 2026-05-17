'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  onMessage: (data: string) => void
  enabled?: boolean
}

const BASE_DELAY = 1000
const MAX_DELAY = 30000

export function useWebSocket(url: string | null, { onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const delayRef = useRef(BASE_DELAY)
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED)

  const connect = useCallback(() => {
    if (!url || !enabled) return

    const ws = new WebSocket(url)
    wsRef.current = ws
    setReadyState(WebSocket.CONNECTING)

    ws.onopen = () => {
      setReadyState(WebSocket.OPEN)
      delayRef.current = BASE_DELAY
    }

    ws.onmessage = (e) => onMessage(e.data)

    ws.onclose = () => {
      setReadyState(WebSocket.CLOSED)
      // Exponential backoff reconnect
      retryRef.current = setTimeout(() => {
        delayRef.current = Math.min(delayRef.current * 2, MAX_DELAY)
        connect()
      }, delayRef.current)
    }

    ws.onerror = () => ws.close()
  }, [url, enabled, onMessage])

  useEffect(() => {
    connect()
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { readyState }
}
