"use client"

/**
 * Toast adapter over `sonner`.
 *
 * This used to be a standalone Radix-toast store whose renderer
 * (`components/ui/toaster.tsx`) was never mounted in any layout, so every
 * `toast(...)` call in the app silently rendered nothing. The only `<Toaster />`
 * actually mounted is sonner's, in `app/layout.tsx`.
 *
 * Rather than rewrite ~77 call sites, this keeps the original object-style API
 * (`toast({ title, description, variant })`) and forwards to sonner. Prefer
 * importing `toast` from `sonner` directly in new code.
 */

import { toast as sonnerToast } from "sonner"
import type { ReactNode } from "react"

export type ToastVariant = "default" | "destructive"

export interface ToastOptions {
  title?: ReactNode
  description?: ReactNode
  variant?: ToastVariant
  duration?: number
  /** Sonner-shaped action. The old Radix `<ToastAction>` element is not supported. */
  action?: { label: ReactNode; onClick: () => void }
}

/** Fires a toast. Returns sonner's toast id, so it can be passed to `dismiss`. */
function toast({ title, description, variant, duration, action }: ToastOptions) {
  const emit = variant === "destructive" ? sonnerToast.error : sonnerToast
  const message: ReactNode = title ?? description ?? ""

  return emit(message, {
    // When only `title` is given, don't repeat it in the description slot.
    description: title == null ? undefined : description,
    duration,
    action,
  })
}

/** Dismisses a specific toast, or all of them when called with no argument. */
function dismiss(toastId?: string | number) {
  sonnerToast.dismiss(toastId)
}

function useToast() {
  return { toast, dismiss }
}

export { useToast, toast, dismiss }
