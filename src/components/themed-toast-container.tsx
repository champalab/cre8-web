import { Flip, ToastContainer, type ToastContainerProps } from 'react-toastify'
import { useTheme } from 'next-themes'

export function ThemedToastContainer(props: Omit<ToastContainerProps, 'theme' | 'transition'>) {
  const { resolvedTheme } = useTheme()

  return (
    <ToastContainer
      {...props}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      transition={Flip}
    />
  )
}
