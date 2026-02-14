export type TutorialId =
  | 'add-expense'
  | 'manage-categories'
  | 'setup-credit-card'
  | 'view-dashboard'

interface TutorialMapping {
  id: TutorialId
  patterns: RegExp[]
}

const TUTORIAL_MAPPINGS: TutorialMapping[] = [
  {
    id: 'setup-credit-card',
    patterns: [
      /como\s+.*(cartao|cartão)/i,
      /onde\s+(cadastro|adiciono|configuro)\s+(um\s+)?(cartao|cartão)/i,
    ],
  },
  {
    id: 'add-expense',
    patterns: [
      /como\s+(adiciono|crio|cadastro|registro|lanc).*(despesa|gasto)/i,
      /como\s+(faco|faço)\s+para\s+(adicion|cri|registr).*(despesa|gasto)/i,
      /como\s+(adicionar|criar|cadastrar|registrar|lancar|lançar)\s+(uma\s+)?(despesa|gasto)/i,
      /onde\s+(adiciono|crio|cadastro)\s+(uma\s+)?(despesa|gasto)/i,
    ],
  },
  {
    id: 'manage-categories',
    patterns: [
      /como\s+(gerencio|edito|altero|mudo|configuro|personalizo).*(categoria)/i,
      /como\s+(faco|faço)\s+para\s+(gerenci|edit|alter).*(categoria)/i,
      /como\s+(gerenciar|editar|alterar|mudar|configurar|personalizar)\s+(as\s+|uma\s+)?categoria/i,
      /onde\s+(fica|estao|ficam|encontro)\s+(as\s+)?categoria/i,
    ],
  },
  {
    id: 'view-dashboard',
    patterns: [
      /como\s+(vejo|uso|acesso|encontro).*(dashboard|painel|relatorio|relatório|grafico|gráfico)/i,
      /como\s+(faco|faço)\s+para\s+(ver|usar|acess).*(dashboard|painel|relatorio|relatório)/i,
      /como\s+(ver|usar|acessar)\s+(o\s+)?(meu\s+)?(dashboard|painel|relatorio|relatório)/i,
      /onde\s+(fica|esta|está)\s+(o\s+)?(dashboard|painel)/i,
    ],
  },
]

export function matchTutorialIntent(message: string): TutorialId | null {
  // biome-ignore lint/suspicious/noMisleadingCharacterClass: intentional diacritical mark stripping
  const diacritics = /[\u0300-\u036f]/g
  const normalized = message.normalize('NFD').replace(diacritics, '').toLowerCase().trim()

  for (const mapping of TUTORIAL_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      const normalizedPattern = new RegExp(
        pattern.source.normalize('NFD').replace(diacritics, ''),
        pattern.flags
      )
      if (normalizedPattern.test(normalized)) {
        return mapping.id
      }
    }
  }

  return null
}
