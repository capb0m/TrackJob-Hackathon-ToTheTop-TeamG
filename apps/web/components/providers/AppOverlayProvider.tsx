'use client'

import { ChatWizardModal } from '@/components/modals/ChatWizardModal'
import { Toaster } from '@/components/ui/toaster'

export function AppOverlayProvider() {
  return (
    <>
      <ChatWizardModal />
      <Toaster />
    </>
  )
}
