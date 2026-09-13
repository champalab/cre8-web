import { toast, ToastOptions } from "react-toastify";

export const ToastDefault = (text: string, options?: ToastOptions) => toast(text, options)
export const ToastSuccess = (text: string, options?: ToastOptions) => toast.success(text, options)
export const ToastInfo = (text: string, options?: ToastOptions) => toast.info(text, options)
export const ToastWarning = (text: string, options?: ToastOptions) => toast.warn(text, options)
export const ToastError = (text: string, options?: ToastOptions) => toast.error(text, options)