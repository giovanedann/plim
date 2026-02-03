/**
 * Content types for multimodal AI input
 */
export type ContentPartType = 'text' | 'image' | 'audio'

export interface TextContentPart {
  type: 'text'
  text: string
}

export interface ImageContentPart {
  type: 'image'
  data: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
}

export interface AudioContentPart {
  type: 'audio'
  data: string
  mimeType: 'audio/wav' | 'audio/mp3' | 'audio/webm' | 'audio/ogg'
}

export type ContentPart = TextContentPart | ImageContentPart | AudioContentPart

/**
 * Message in chat history
 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: ContentPart[]
}

/**
 * JSON Schema for function parameters
 */
export interface JsonSchema {
  type: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array'
  description?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  enum?: string[]
  nullable?: boolean
}

/**
 * Function definition for function calling
 * Uses JSON Schema for parameters (portable across LLM providers)
 */
export interface FunctionDefinition {
  name: string
  description: string
  parameters: JsonSchema
}

/**
 * Function call returned by the AI
 */
export interface FunctionCall {
  name: string
  args: Record<string, unknown>
}

/**
 * Input for chat completion
 */
export interface ChatInput {
  messages: ChatMessage[]
  systemPrompt?: string
  functions?: FunctionDefinition[]
}

/**
 * Output from chat completion
 */
export interface ChatOutput {
  text: string | null
  functionCall: FunctionCall | null
  tokensUsed: number
}

/**
 * AI Client interface - abstracts the underlying LLM provider
 */
export interface AIClient {
  chat(input: ChatInput): Promise<ChatOutput>
}
