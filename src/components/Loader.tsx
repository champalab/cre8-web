import { Loader2 } from 'lucide-react'

const Loader = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm">
    <Loader2 className="size-10 animate-spin text-primary" />
  </div>
)

export default Loader
