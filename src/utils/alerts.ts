import Swal, { SweetAlertOptions } from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import i18n from '@/i18n'

const palette = {
  primary: '#1B75BA',
  secondary: '#666666',
  warning: '#FFC500',
  info: '#89CFF0',
  success: '#34A853',
  error: '#FF3A1E',
}

export const Alert = withReactContent(Swal)

export const alertSuccess = (options: SweetAlertOptions) =>
  Alert.fire({
    icon: 'success',
    title: options.title,
    text: options.text,
    iconColor: palette.success,
    color: palette.secondary,
    timer: options.timer ?? 2500,
    showConfirmButton: false,
    customClass: { container: 'my-swal' },
  })

export const alertInfo = (options: SweetAlertOptions) =>
  Alert.fire({
    icon: 'info',
    title: options.title,
    text: options.text,
    iconColor: palette.info,
    color: palette.secondary,
    timer: options.timer ?? 2500,
    showConfirmButton: false,
    customClass: { container: 'my-swal' },
  })

export const alertWarning = (options: SweetAlertOptions) =>
  Alert.fire({
    icon: 'warning',
    title: options.title,
    text: options.text,
    iconColor: palette.warning,
    color: palette.secondary,
    timer: options.timer ?? 2500,
    showConfirmButton: false,
    customClass: { container: 'my-swal' },
  })

export const alertError = (options: SweetAlertOptions) =>
  Alert.fire({
    icon: 'error',
    title: options.title,
    text: options.text,
    iconColor: palette.error,
    color: palette.secondary,
    timer: options.timer || 2500,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: options.cancelButtonText ?? i18n.t('ok'),
    customClass: { container: 'my-swal' },
  })

export const alertQuestion = (options: SweetAlertOptions) =>
  Alert.fire({
    icon: 'question',
    title: options.title,
    text: options.text,
    iconColor: palette.primary,
    color: palette.secondary,
    timer: options.timer ?? 2500,
    showConfirmButton: false,
    customClass: { container: 'my-swal' },
  })

/** Confirm destructive delete actions */
export const confirmDelete = (options: SweetAlertOptions) =>
  Alert.fire({
    icon: 'warning',
    title: options.title ?? i18n.t('areYouSure'),
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText ?? i18n.t('delete'),
    cancelButtonText: options.cancelButtonText ?? i18n.t('cancel'),
    confirmButtonColor: palette.error,
    cancelButtonColor: palette.secondary,
    reverseButtons: true,
    customClass: { container: 'my-swal' },
  })

/** Confirm general user actions (cancel, submit, update, etc.) */
export const confirmAction = (options: SweetAlertOptions) =>
  Alert.fire({
    icon: options.icon ?? 'question',
    title: options.title ?? i18n.t('areYouSure'),
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText ?? i18n.t('confirm'),
    cancelButtonText: options.cancelButtonText ?? i18n.t('cancel'),
    confirmButtonColor: options.confirmButtonColor ?? palette.primary,
    cancelButtonColor: palette.secondary,
    reverseButtons: true,
    customClass: { container: 'my-swal' },
  })
