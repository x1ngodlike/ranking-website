import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

// Empty component
export default function Empty() {
  const designVersion = useAppStore((s) => s.designVersion);
  return (
    <div className={cn('flex h-full items-center justify-center', designVersion === 'v2' && 'font-v2-body text-[var(--v2-text-secondary)]')}>Empty</div>
  )
}
