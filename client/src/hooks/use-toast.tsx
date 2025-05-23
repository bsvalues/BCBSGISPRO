import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast"
import {
  useToast as useToastPrimitive
} from "@/components/ui/use-toast"

type ToastActionProps = React.ComponentPropsWithoutRef<typeof Toast> & {
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
    dismiss: (toastId?: string) => toast({
      id: toastId,
    }),
  }
}