import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Resolves the WebSocket URL for the direct broadcast relay:
 * 1. URL query override: ?relay=wss://your-vps/relay
 * 2. Vite environment variable: VITE_RELAY_WS_URL
 * 3. Sensible local / network default
 */
export function getRelayUrl() {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  const queryOverride = params.get('relay')
  if (queryOverride) return queryOverride

  if (import.meta.env.VITE_RELAY_WS_URL) {
    return import.meta.env.VITE_RELAY_WS_URL
  }

  // Fallback based on host
  const isHttps = window.location.protocol === 'https:'
  const host = window.location.hostname || 'localhost'
  return `${isHttps ? 'wss:' : 'ws:'}//${host}:8080/relay`
}

/**
 * Custom React hook for connecting the 3D space relic timeline
 * to the companion iOS remote controller via the direct broadcast relay.
 */
export function useRemoteSync({ onNavigate, onRotate, onAction, state }) {
  const [status, setStatus] = useState('disconnected') // 'connecting' | 'connected' | 'disconnected'
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const isUnmounted = useRef(false)

  // Keep latest callbacks in refs to avoid re-triggering socket recreation
  const onNavigateRef = useRef(onNavigate)
  onNavigateRef.current = onNavigate
  const onRotateRef = useRef(onRotate)
  onRotateRef.current = onRotate
  const onActionRef = useRef(onAction)
  onActionRef.current = onAction

  const stateRef = useRef(state)
  stateRef.current = state

  const sendStateSync = useCallback((customState) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const payload = customState || stateRef.current
    if (!payload) return

    try {
      ws.send(
        JSON.stringify({
          type: 'STATE_SYNC',
          payload,
        }),
      )
    } catch {
      // Ignore transient serialization errors
    }
  }, [])

  const connect = useCallback(() => {
    if (isUnmounted.current) return
    const url = getRelayUrl()
    if (!url) return

    clearTimeout(reconnectTimer.current)
    setStatus('connecting')

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (isUnmounted.current) {
          ws.close()
          return
        }
        setStatus('connected')
        // Immediately broadcast current state to any connected remote
        sendStateSync()
      }

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data)
          if (!packet || typeof packet !== 'object') return

          const { type, payload } = packet

          switch (type) {
            case 'NAVIGATE':
              if (onNavigateRef.current && payload) {
                onNavigateRef.current(payload)
              }
              break

            case 'ROTATE':
              if (onRotateRef.current && payload) {
                onRotateRef.current(payload)
              }
              break

            case 'TRIGGER_ACTION':
              if (onActionRef.current && payload?.action) {
                onActionRef.current(payload.action)
              }
              break

            default:
              break
          }
        } catch {
          // Ignore malformed packets
        }
      }

      ws.onerror = () => {
        // Will trigger ws.onclose
      }

      ws.onclose = () => {
        wsRef.current = null
        if (!isUnmounted.current) {
          setStatus('disconnected')
          // Silent 2-second auto-reconnection loop
          reconnectTimer.current = setTimeout(() => {
            connect()
          }, 2000)
        }
      }
    } catch {
      setStatus('disconnected')
      reconnectTimer.current = setTimeout(() => {
        connect()
      }, 2000)
    }
  }, [sendStateSync])

  // Establish connection on mount
  useEffect(() => {
    isUnmounted.current = false
    connect()

    return () => {
      isUnmounted.current = true
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  // Broadcast state updates whenever local state changes
  useEffect(() => {
    if (status === 'connected') {
      sendStateSync(state)
    }
  }, [state, status, sendStateSync])

  return {
    status,
    sendStateSync,
  }
}

