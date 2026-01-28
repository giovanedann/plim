import { type ApiResponse, api } from '@/lib/api-client'
import type { Category, CreateCategory, UpdateCategory } from '@plim/shared'

export const categoryService = {
  async listCategories(): Promise<ApiResponse<Category[]>> {
    return api.get<Category[]>('/categories')
  },

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return api.get<Category>(`/categories/${id}`)
  },

  async createCategory(data: CreateCategory): Promise<ApiResponse<Category>> {
    return api.post<Category>('/categories', data)
  },

  async updateCategory(id: string, data: UpdateCategory): Promise<ApiResponse<Category>> {
    return api.patch<Category>(`/categories/${id}`, data)
  },

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/categories/${id}`)
  },
}
