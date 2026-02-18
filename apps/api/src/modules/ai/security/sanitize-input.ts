const MAX_INPUT_LENGTH = 2000

const BLOCKED_RESPONSE =
  'Sou um assistente financeiro do Plim. Como posso ajudar com suas finanças?'

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|prior|your|the)\s+(instructions|rules|prompt)/i,
  /ignore\s+as\s+instruc/i,
  /forget\s+(your|all|previous)\s+(instructions|rules|prompt)/i,
  /esqueca\s+(suas|as|todas)\s+(instruc|regras)/i,
  /you\s+are\s+now/i,
  /voce\s+(agora\s+)?e\s+um/i,
  /act\s+as\s+(a|an|if)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /finja\s+(que\s+)?(voce\s+)?e/i,
  /system\s*prompt/i,
  /reveal\s+(your|the)\s+(prompt|instructions|system)/i,
  /what\s+are\s+your\s+(instructions|rules)/i,
  /quais\s+(sao\s+)?(suas|as)\s+(instruc|regras)/i,
  /mostre\s+(seu|o)\s+(prompt|sistema)/i,
  /show\s+(me\s+)?(your|the)\s+(prompt|instructions|system)/i,
  /repeat\s+(your|the)\s+(system|initial)\s+(prompt|message|instructions)/i,
  /repita\s+(seu|o)\s+(prompt|sistema)/i,
  /\bDAN\b.*\bjailbreak/i,
  /\bjailbreak\b/i,
]

export interface SanitizeResult {
  blocked: boolean
  message: string
  reason?: string
}

export function sanitizeInput(message: string): SanitizeResult {
  const truncated = message.slice(0, MAX_INPUT_LENGTH)

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(truncated)) {
      return {
        blocked: true,
        message: BLOCKED_RESPONSE,
        reason: 'blocked_injection',
      }
    }
  }

  return { blocked: false, message: truncated }
}
