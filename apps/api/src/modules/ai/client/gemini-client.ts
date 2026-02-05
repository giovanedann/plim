import {
  type Content,
  type FunctionDeclaration,
  type FunctionDeclarationSchema,
  type GenerateContentResult,
  GoogleGenerativeAI,
  type Part,
  type Schema,
  SchemaType,
} from '@google/generative-ai'
import type {
  AIClient,
  AudioContentPart,
  ChatInput,
  ChatMessage,
  ChatOutput,
  ContentPart,
  EmbeddingOutput,
  FunctionCall,
  FunctionDefinition,
  ImageContentPart,
  JsonSchema,
} from './ai-client.types'

const DEFAULT_MODEL = 'gemini-2.5-flash'
const EMBEDDING_MODEL = 'text-embedding-004'

/**
 * Gemini implementation of AIClient
 * Wraps the Google Generative AI SDK with our clean types
 */
export class GeminiClient implements AIClient {
  private readonly genAI: GoogleGenerativeAI
  private readonly modelName: string

  constructor(apiKey: string, modelName?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.modelName = modelName ?? DEFAULT_MODEL
  }

  async chat(input: ChatInput): Promise<ChatOutput> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: input.systemPrompt,
      tools: input.functions
        ? [{ functionDeclarations: this.convertFunctions(input.functions) }]
        : undefined,
    })

    const contents = this.convertMessages(input.messages)
    const result = await model.generateContent({ contents })

    return this.parseResponse(result)
  }

  async generateEmbedding(text: string): Promise<EmbeddingOutput> {
    const model = this.genAI.getGenerativeModel({ model: EMBEDDING_MODEL })
    const result = await model.embedContent(text)
    return { embedding: result.embedding.values }
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
        return this.convertImagePart(part)
      case 'audio':
        return this.convertAudioPart(part)
    }
  }

  private convertImagePart(part: ImageContentPart): Part {
    return {
      inlineData: {
        mimeType: part.mimeType,
        data: part.data,
      },
    }
  }

  private convertAudioPart(part: AudioContentPart): Part {
    return {
      inlineData: {
        mimeType: part.mimeType,
        data: part.data,
      },
    }
  }

  private convertFunctions(functions: FunctionDefinition[]): FunctionDeclaration[] {
    return functions.map((fn) => ({
      name: fn.name,
      description: fn.description,
      parameters: this.convertToFunctionDeclarationSchema(fn.parameters),
    }))
  }

  private convertToFunctionDeclarationSchema(schema: JsonSchema): FunctionDeclarationSchema {
    const properties: Record<string, Schema> = {}

    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        properties[key] = this.convertToSchema(value)
      }
    }

    return {
      type: SchemaType.OBJECT,
      properties,
      description: schema.description,
      required: schema.required,
    }
  }

  private convertToSchema(schema: JsonSchema): Schema {
    const base = {
      description: schema.description,
      nullable: schema.nullable,
    }

    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return {
            ...base,
            type: SchemaType.STRING,
            format: 'enum' as const,
            enum: schema.enum,
          }
        }
        return {
          ...base,
          type: SchemaType.STRING,
        }

      case 'number':
        return {
          ...base,
          type: SchemaType.NUMBER,
        }

      case 'integer':
        return {
          ...base,
          type: SchemaType.INTEGER,
        }

      case 'boolean':
        return {
          ...base,
          type: SchemaType.BOOLEAN,
        }

      case 'array':
        return {
          ...base,
          type: SchemaType.ARRAY,
          items: schema.items ? this.convertToSchema(schema.items) : { type: SchemaType.STRING },
        }

      case 'object': {
        const properties: Record<string, Schema> = {}
        if (schema.properties) {
          for (const [key, value] of Object.entries(schema.properties)) {
            properties[key] = this.convertToSchema(value)
          }
        }
        return {
          ...base,
          type: SchemaType.OBJECT,
          properties,
          required: schema.required,
        }
      }

      default:
        return {
          ...base,
          type: SchemaType.STRING,
        }
    }
  }

  private parseResponse(result: GenerateContentResult): ChatOutput {
    const response = result.response
    const candidate = response.candidates?.[0]

    if (!candidate?.content?.parts) {
      return {
        text: null,
        functionCall: null,
        tokensUsed: this.getTokenCount(result),
      }
    }

    const parts = candidate.content.parts
    const functionCallPart = parts.find((part) => 'functionCall' in part)
    const textPart = parts.find((part) => 'text' in part)

    let functionCall: FunctionCall | null = null
    if (functionCallPart && 'functionCall' in functionCallPart && functionCallPart.functionCall) {
      functionCall = {
        name: functionCallPart.functionCall.name,
        args: (functionCallPart.functionCall.args ?? {}) as Record<string, unknown>,
      }
    }

    return {
      text: textPart && 'text' in textPart ? (textPart.text ?? null) : null,
      functionCall,
      tokensUsed: this.getTokenCount(result),
    }
  }

  private getTokenCount(result: GenerateContentResult): number {
    const usage = result.response.usageMetadata
    if (!usage) return 0
    return (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0)
  }
}
