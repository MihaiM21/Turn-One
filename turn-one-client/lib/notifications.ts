import { toast } from "sonner"

type NotificationType = "success" | "error" | "info" | "warning"

interface NotificationOptions {
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

export function showNotification(
  message: string,
  type: NotificationType = "info",
  options: NotificationOptions = {}
) {
  const { description, action, duration } = options

  const toastOptions = {
    description,
    duration: duration || 5000,
    ...(action && {
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    }),
  }

  switch (type) {
    case "success":
      toast.success(message, toastOptions)
      break
    case "error":
      toast.error(message, toastOptions)
      break
    case "warning":
      toast.warning(message, toastOptions)
      break
    default:
      toast(message, toastOptions)
  }
}

// Shorthand functions for common notification types
export const notify = {
  success: (message: string, options?: NotificationOptions) =>
    showNotification(message, "success", options),
  error: (message: string, options?: NotificationOptions) =>
    showNotification(message, "error", options),
  warning: (message: string, options?: NotificationOptions) =>
    showNotification(message, "warning", options),
  info: (message: string, options?: NotificationOptions) =>
    showNotification(message, "info", options),
}