import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type AuthListener = (event: string, session: MockSession | null) => void
type MockSession = {
  access_token: string
  user: {
    id: string
    email: string
  }
}

let client: SupabaseClient | null = null
let listeners: AuthListener[] = []

const SESSION_KEY = 'lifebalance:mock-session'

function readMockSession(): MockSession | null {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  return JSON.parse(raw) as MockSession
}

function writeMockSession(session: MockSession | null) {
  if (typeof window === 'undefined') return

  if (!session) {
    localStorage.removeItem(SESSION_KEY)
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  listeners.forEach((listener) => listener(session ? 'SIGNED_IN' : 'SIGNED_OUT', session))
}

function createMockClient() {
  return {
    auth: {
      async getSession() {
        return { data: { session: readMockSession() }, error: null }
      },
      async signInWithPassword({ email }: { email: string; password: string }) {
        const session: MockSession = {
          access_token: 'mock-jwt-token',
          user: { id: 'mock-user', email },
        }
        writeMockSession(session)
        return { data: { session }, error: null }
      },
      async signUp({ email }: { email: string; password: string }) {
        const session: MockSession = {
          access_token: 'mock-jwt-token',
          user: { id: 'mock-user', email },
        }
        writeMockSession(session)
        return { data: { user: session.user, session }, error: null }
      },
      async signOut() {
        writeMockSession(null)
        return { error: null }
      },
      onAuthStateChange(listener: AuthListener) {
        listeners = [...listeners, listener]
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners = listeners.filter((item) => item !== listener)
              },
            },
          },
        }
      },
    },
  }
}

export function getSupabaseBrowserClient() {
  if (client) {
    return client
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return createMockClient() as unknown as SupabaseClient
  }

  client = createClient(url, anonKey)
  return client
}
