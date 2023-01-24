import { useEffect, useRef } from 'react'

type Options = Pick<AddEventListenerOptions, 'capture' | 'passive' | 'once'>
type Handler = (event: Event) => EventListenerOrEventListenerObject

export function useEventListener(
  eventName: string,
  handler: Handler,
  element: HTMLElement | Document | Window | null,
  options: Options = {}
) {
  // Create a ref that stores handler
  const saveHandler = useRef<Handler>()
  const { capture, passive, once } = options

  // Update ref.current value if handler changes
  useEffect(() => {
    saveHandler.current = handler
  }, [handler])

  useEffect(() => {
    // Check if element supports addEventListener
    const isSupported = element && element.addEventListener
    if (!isSupported) return

    // Create event listener that calls handler function stored in ref
    const eventListener = (event: Event) => saveHandler.current?.(event)

    const opts = { capture, passive, once }

    // Add event listener
    element.addEventListener(eventName, eventListener, opts)

    // Remove event listener on cleanup
    return () => {
      element.removeEventListener(eventName, eventListener, opts)
    }
  }, [eventName, element, capture, passive, once])
}
