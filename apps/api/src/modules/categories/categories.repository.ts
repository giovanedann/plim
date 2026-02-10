import type { Category, CreateCategory, UpdateCategory } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

const CATEGORY_COLUMNS = 'id, user_id, name, icon, color, is_active, created_at, updated_at'

export class CategoriesRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByUserId(userId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('category')
      .select(CATEGORY_COLUMNS)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .eq('is_active', true)
      .order('name')

    if (error) return []

    return data as Category[]
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('category')
      .select(CATEGORY_COLUMNS)
      .eq('id', id)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .single()

    if (error || !data) return null

    return data as Category
  }

  async countByUserId(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('category')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)

    return count ?? 0
  }

  async create(userId: string, input: CreateCategory): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('category')
      .insert({
        user_id: userId,
        name: input.name,
        icon: input.icon ?? null,
        color: input.color ?? null,
      })
      .select(CATEGORY_COLUMNS)
      .single()

    if (error || !data) return null

    return data as Category
  }

  async update(id: string, userId: string, input: UpdateCategory): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('category')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(CATEGORY_COLUMNS)
      .single()

    if (error || !data) return null

    return data as Category
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('category')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    return !error && (count ?? 0) > 0
  }
}
