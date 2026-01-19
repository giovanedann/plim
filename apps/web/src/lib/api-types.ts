export interface Profile {
  id: string
  user_id: string
  display_name: string | null
  currency: string
  locale: string
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface SalaryEntry {
  id: string
  user_id: string
  amount: number
  effective_date: string
  created_at: string
}
