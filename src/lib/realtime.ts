import { useEffect } from "react"
import type { RealtimeAccountUpdate } from "./api"

export const ACCOUNT_UPDATE_EVENT = "eventpay:account-update"

export function emitAccountUpdate(update: RealtimeAccountUpdate) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<RealtimeAccountUpdate>(ACCOUNT_UPDATE_EVENT, {
      detail: update,
    }),
  )
}

export function useAccountUpdateListener(handler: (update: RealtimeAccountUpdate) => void) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const listener: EventListener = (event) => {
      const customEvent = event as CustomEvent<RealtimeAccountUpdate>
      if (customEvent.detail) {
        handler(customEvent.detail)
      }
    }

    window.addEventListener(ACCOUNT_UPDATE_EVENT, listener)
    return () => {
      window.removeEventListener(ACCOUNT_UPDATE_EVENT, listener)
    }
  }, [handler])
}
