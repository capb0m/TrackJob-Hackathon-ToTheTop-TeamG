'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { useChatWizardStore } from '@/stores/chatWizardStore'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '📊' },
  { href: '/expense', label: '支出管理', icon: '💳' },
  { href: '/budget', label: '予算/目標', icon: '🎯' },
  { href: '/future', label: '将来設計', icon: '🔮' },
  { href: '/advice', label: 'AIアドバイス', icon: '💡' },
  { href: '/settings', label: '設定', icon: '⚙️' },
] as const

interface SidebarProps {
  mobileOpen?: boolean
  onNavigate?: () => void
}

export function Sidebar({ mobileOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const openChatWizard = useChatWizardStore((state) => state.open)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-bg2 px-3 py-6 transition-transform md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="mb-8 px-3">
        <div className="font-display text-xl font-extrabold tracking-tight">
          Life<span className="text-accent">Balance</span>
        </div>
      </div>

      <nav className="space-y-1 px-1" aria-label="メインナビゲーション">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text2 transition-colors',
                isActive && 'bg-accent/10 text-accent',
                !isActive && 'hover:bg-white/5 hover:text-text',
              )}
              onClick={onNavigate}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        <Button variant="ghost" className="w-full justify-start" onClick={() => openChatWizard('setup')}>
          🤖 チャット設定
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={async () => {
            const supabase = getSupabaseBrowserClient()
            await supabase.auth.signOut()
            router.replace('/login')
          }}
        >
          ↩ ログアウト
        </Button>
      </div>
    </aside>
  )
}
