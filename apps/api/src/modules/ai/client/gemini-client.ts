import { type GoogleGenAI, Type } from '@google/genai'
import type {
  Content,
  FunctionDeclaration,
  GenerateContentResponse,
  Part,
  Schema,
} from '@google/genai'
import type {
  AIClient,
  ChatInput,
  ChatMessage,
  ChatOutput,
  ContentPart,
  EmbeddingOutput,
  FunctionCall,
  FunctionDefinition,
  JsonSchema,
} from './ai-client.types'

const DEFAULT_MODEL = 'gemini-2.5-flash'
const EMBEDDING_MODEL = 'gemini-embedding-001'
const EMBEDDING_DIMENSIONS = 768

export class GeminiClient implements AIClient {
  private readonly genAI: GoogleGenAI
  private readonly modelName: string

  constructor(genAI: GoogleGenAI, modelName?: string) {
    this.genAI = genAI
    this.modelName = modelName ?? DEFAULT_MODEL
  }

  async chat(input: ChatInput): Promise<ChatOutput> {
    const result = await this.genAI.models.generateContent({
      model: this.modelName,
      contents: this.convertMessages(input.messages),
      config: {
        systemInstruction: input.systemPrompt,
        tools: input.functions
          ? [{ functionDeclarations: this.convertFunctions(input.functions) }]
          : undefined,
      },
    })

    return this.parseResponse(result)
  }

  async generateEmbedding(text: string): Promise<EmbeddingOutput> {
    const result = await this.genAI.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    })

    const values = result.embeddings?.[0]?.values
    if (!values) {
      throw new Error('Embedding response missing values')
    }

    return { embedding: values }
  }

  private convertMessages(messages: ChatMessage[]): Content[] {
    return messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: msg.content.map((part) => this.convertContentPart(part)),
    }))
  }

  private convertContentPart(part: ContentPart): Part {
    switch (part.type) {
      case 'text':
        return { text: part.text }
      case 'image':
      case 'audio':
        return { inlineData: { mimeType: part.mimeType, data: part.data } }
    }
  }

  private convertFunctions(functions: FunctionDefinition[]): FunctionDeclaration[] {
    return functions.map((fn) => ({
      name: fn.name,
      description: fn.description,
      parameters: this.convertToSchema(fn.parameters),
    }))
  }

  private convertToSchema(schema: JsonSchema): Schema {
    const base: Schema = {
      description: schema.description,
      nullable: schema.nullable,
    }

    switch (schema.type) {
      case 'string':
        return { ...base, type: Type.STRING, ...(schema.enum ? { enum: schema.enum } : {}) }

      case 'number':
        return { ...base, type: Type.NUMBER }

      case 'integer':
        return { ...base, type: Type.INTEGER }

      case 'boolean':
        return { ...base, type: Type.BOOLEAN }

      case 'array':
        return {
          ...base,
          type: Type.ARRAY,
          items: schema.items ? this.convertToSchema(schema.items) : { type: Type.STRING },
        }

      case 'object': {
        const properties: Record<string, Schema> = {}
        if (schema.properties) {
          for (const [key, value] of Object.entries(schema.properties)) {
            properties[key] = this.convertToSchema(value)
          }
        }
        return { ...base, type: Type.OBJECT, properties, required: schema.required }
      }

      default:
        return { ...base, type: Type.STRING }
    }
  }

  private parseResponse(result: GenerateContentResponse): ChatOutput {
    const functionCalls = result.functionCalls
    let functionCall: FunctionCall | null = null

    if (functionCalls?.[0]) {
      functionCall = {
        name: functionCalls[0].name ?? '',
        args: (functionCalls[0].args ?? {}) as Record<string, unknown>,
      }
    }

    const usage = result.usageMetadata
    const inputTokens = usage?.promptTokenCount ?? 0
    const outputTokens = usage?.candidatesTokenCount ?? 0

    return {
      text: functionCall ? null : (result.text ?? null),
      functionCall,
      tokensUsed: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
    }
  }
}
