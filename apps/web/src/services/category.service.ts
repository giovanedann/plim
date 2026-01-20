import { api } from '@/lib/api-client'
import type { Category, CreateCategory, UpdateCategory } from '@plim/shared'

export const categoryService = {
  async listCategories() {
    return api.get<Category[]>('/categories')
  },

  async getCategory(id: string) {
    return api.get<Category>(`/categories/${id}`)
  },

  async createCategory(data: CreateCategory) {
    return api.post<Category>('/categories', data)
  },

  async updateCategory(id: string, data: UpdateCategory) {
    return api.patch<Category>(`/categories/${id}`, data)
  },

  async deleteCategory(id: string) {
    return api.delete<void>(`/categories/${id}`)
  },
}
