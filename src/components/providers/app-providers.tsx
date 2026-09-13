import { ThemeProvider } from '@/components/theme-provider'

type Props = {
  children: React.ReactNode
}

export function AppProviders({ children }: Props) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
