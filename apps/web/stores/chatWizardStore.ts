import { create } from 'zustand'

export type ChatWizardContext = 'setup' | 'budget'

interface ChatWizardStore {
  isOpen: boolean
  context: ChatWizardContext
  open: (context?: ChatWizardContext) => void
  close: () => void
}

export const useChatWizardStore = create<ChatWizardStore>((set) => ({
  isOpen: false,
  context: 'setup',
  open: (context = 'setup') => set({ isOpen: true, context }),
  close: () => set({ isOpen: false }),
}))
