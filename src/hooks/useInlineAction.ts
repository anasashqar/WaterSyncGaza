import { useState, useCallback, useRef, useEffect } from 'react'
import { useUIStore } from '@/stores/useUIStore'

export type ActionStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseInlineActionOptions {
  /** How long the success state should persist before reverting to 'idle' */
  successDuration?: number
  /** If true, fires a global toast on error (for critical operations) */
  globalErrorToast?: boolean
}

/**
 * Hook to manage inline feedback states for buttons and forms,
 * adhering to the "Quiet Confidence" UX strategy.
 * Uses AbortController to actively cancel network requests if the component unmounts.
 */
export function useInlineAction(options: UseInlineActionOptions = {}) {
  const { successDuration = 2000, globalErrorToast = false } = options
  
  const [status, setStatus] = useState<ActionStatus>('idle')
  const [errorText, setErrorText] = useState<string | null>(null)
  
  const timeoutRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const addNotification = useUIStore(s => s.addNotification)

  // Cleanup on unmount: abort any pending request and clear timeouts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const execute = useCallback(async <T>(
    actionFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T | undefined> => {
    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
      
    setStatus('loading')
    setErrorText(null)

    try {
      const result = await actionFn(controller.signal)
      
      // If the request was aborted during execution, do not proceed with success state
      if (controller.signal.aborted) return undefined

      setStatus('success')
      
      // Auto-revert back to idle after successDuration
      timeoutRef.current = window.setTimeout(() => {
        if (!controller.signal.aborted) {
          setStatus('idle')
          setErrorText(null)
        }
      }, successDuration)
      
      return result
    } catch (err: any) {
      // Ignore AbortError: it simply means the component unmounted or request was cancelled
      if (err.name === 'AbortError' || controller.signal.aborted) {
        return undefined
      }

      setStatus('error')
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
      setErrorText(msg)
      
      if (globalErrorToast) {
        addNotification(msg, 'error')
      }
      
      return undefined
    } finally {
      // Clean up the ref if this is still the active controller
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [successDuration, globalErrorToast, addNotification])

  return {
    execute,
    status,
    errorText,
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error'
  }
}
