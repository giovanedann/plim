import { type ApiResponse, api } from '@/lib/api-client'
import type { AIChatRequest, AIChatResponse, AIUsageResponse } from '@plim/shared'

export const aiService = {
  async chat(request: AIChatRequest): Promise<ApiResponse<AIChatResponse>> {
    return api.post<AIChatResponse>('/ai/chat', request)
  },

  async getUsage(): Promise<ApiResponse<AIUsageResponse>> {
    return api.get<AIUsageResponse>('/ai/usage')
  },
}
