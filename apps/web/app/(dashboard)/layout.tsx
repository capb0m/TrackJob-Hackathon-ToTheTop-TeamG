'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { MobileHeader } from '@/components/layout/MobileHeader'
import { Sidebar } from '@/components/layout/Sidebar'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return

      if (!data.session) {
        router.replace('/login')
        return
      }

      setCheckingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-text2">セッション確認中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="メニューを閉じる"
        />
      ) : null}
      <MobileHeader onMenuClick={() => setMobileOpen(true)} />
      <main className="animate-fade-up p-4 md:p-8">{children}</main>
    </div>
  )
}
