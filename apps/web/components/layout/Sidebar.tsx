'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getSupabaseBrowserClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '📊' },
  { href: '/expense', label: '支出管理', icon: '💳' },
  { href: '/budget', label: '予算と目標', icon: '🎯' },
  { href: '/future', label: 'ライフプラン', icon: '🔮' },
  { href: '/advice', label: 'KakeAI', icon: '💡' },
] as const

interface SidebarProps {
  mobileOpen?: boolean
  onNavigate?: () => void
}

export function Sidebar({ mobileOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-bg2 px-3 py-6 shadow-[8px_0_24px_rgba(40,56,90,0.06)] transition-transform md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <Link href="/dashboard" onClick={onNavigate} className="mb-8 flex items-center gap-2 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent2 font-display text-sm font-extrabold text-white">
          K
        </div>
        <div className="font-body text-xl font-semibold tracking-tight text-text">
          Kake<span className="text-accent">AI</span>
        </div>
      </Link>

      <nav className="space-y-1 px-1" aria-label="サイドバー">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-text2 transition-colors',
                isActive &&
                  'bg-accent/15 font-medium text-accent before:absolute before:inset-y-[20%] before:left-0 before:w-[3px] before:rounded-r before:bg-accent',
                !isActive && 'hover:bg-accent/10 hover:text-text',
              )}
              onClick={onNavigate}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border px-1 pt-4">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-text2 transition-colors',
            pathname === '/settings' ? 'border-accent/50 bg-accent/10 text-accent' : 'hover:border-accent/50 hover:bg-accent/10 hover:text-text',
          )}
        >
          ⚙️ 設定
        </Link>
        <Button
          variant="ghost"
          className="h-10 justify-center px-2"
          onClick={async () => {
            const supabase = getSupabaseBrowserClient()
            await supabase.auth.signOut()
            router.replace('/login')
            onNavigate?.()
          }}
        >
          ↩ ログアウト
        </Button>
      </div>
    </aside>
  )
}
