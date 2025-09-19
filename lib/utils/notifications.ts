import { toast } from "sonner"

export const showNotification = {
  success: (message: string, options?: { duration?: number }) => 
    toast.success(message, { 
      duration: options?.duration || 4000,
      dismissible: true 
    }),
  error: (message: string, options?: { duration?: number }) => 
    toast.error(message, { 
      duration: options?.duration || 6000,
      dismissible: true 
    }),
  info: (message: string, options?: { duration?: number }) => 
    toast.info(message, { 
      duration: options?.duration || 4000,
      dismissible: true 
    }),
  warning: (message: string, options?: { duration?: number }) => 
    toast.warning(message, { 
      duration: options?.duration || 5000,
      dismissible: true 
    }),
}

export const showLoading = (message: string = "Loading...") => {
  return toast.loading(message)
}

export const dismissLoading = (toastId: string | number) => {
  toast.dismiss(toastId)
}

export const dismissToast = (toastId?: string | number) => {
  if (toastId) {
    toast.dismiss(toastId)
  } else {
    toast.dismiss() // Dismiss all toasts
  }
}

export const showConfirmDialog = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  toast(message, {
    action: {
      label: "Confirm",
      onClick: onConfirm,
    },
    ...(onCancel && {
      cancel: {
        label: "Cancel",
        onClick: onCancel,
      },
    }),
  })
}
