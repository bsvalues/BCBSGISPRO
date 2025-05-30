import { ToastActionElement, ToastProps } from "../components/ui/toast"
import { useToast as useToastPrimitive } from "../components/ui/use-toast"

type ToastActionProps = {
  altText: string;
}

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const { toast } = useToastPrimitive()
  
  return {
    toast,
    // Simplified dismiss function
    dismiss: (toastId?: string) => {
      if (toastId) {
        // If we have an ID, we'll use it to dismiss a specific toast
        toast({ title: " ", id: toastId })
      }
    },
  }
}