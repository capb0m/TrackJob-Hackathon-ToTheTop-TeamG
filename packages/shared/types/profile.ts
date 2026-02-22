export interface UserProfile {
  id: string
  display_name: string
  monthly_income: number
  created_at: string
  updated_at?: string
}

export interface ExternalConnection {
  id: string
  platform: 'line' | 'discord'
  is_active: boolean
  connected_at: string
  external_user_id?: string
  created_at?: string
}
