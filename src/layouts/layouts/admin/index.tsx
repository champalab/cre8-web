import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader, useDrawerToggle } from '@/components/layout/app-header'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export default function ADMINLayout() {
  const { open, toggle, close } = useDrawerToggle()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    if (window.innerWidth <= 960) {
      close()
    }
  }, [close])

  const collapsed = !open

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar collapsed={collapsed} className="hidden md:flex" />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 md:hidden">
          <AppSidebar collapsed={false} embedded className="h-full w-full border-0" />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out',
          collapsed ? 'md:ml-[4.5rem]' : 'md:ml-60'
        )}
      >
        <AppHeader
          collapsed={collapsed}
          onToggle={toggle}
          onMobileOpen={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
