export type TutorialId =
  | 'add-expense'
  | 'manage-categories'
  | 'setup-credit-card'
  | 'view-dashboard'
  | 'profile-settings'
  | 'view-upgrade'

interface TutorialMapping {
  id: TutorialId
  patterns: RegExp[]
}

const TUTORIAL_MAPPINGS: TutorialMapping[] = [
  {
    id: 'setup-credit-card',
    patterns: [
      /como\s+.*(cartao|cartão|cartoes|cartões)/i,
      /onde\s+(cadastro|adiciono|configuro)\s+(um\s+|os\s+|meus\s+)?(cartao|cartão|cartoes|cartões)/i,
    ],
  },
  {
    id: 'add-expense',
    patterns: [
      /como\s+(adiciono|crio|cadastro|registro|lanc).*(despesa|despesas|gasto|gastos)/i,
      /como\s+(faco|faço)\s+para\s+(adicion|cri|registr).*(despesa|despesas|gasto|gastos)/i,
      /como\s+(adicionar|criar|cadastrar|registrar|lancar|lançar)\s+(uma\s+|as\s+|minhas\s+)?(despesa|despesas|gasto|gastos)/i,
      /onde\s+(adiciono|crio|cadastro)\s+(uma\s+|as\s+|minhas\s+)?(despesa|despesas|gasto|gastos)/i,
    ],
  },
  {
    id: 'manage-categories',
    patterns: [
      /como\s+(gerencio|edito|altero|mudo|configuro|personalizo|vejo|uso|crio|registro|cadastro|adiciono).*(categoria|categorias)/i,
      /como\s+(faco|faço)\s+para\s+(gerenci|edit|alter|ver|usa|cri|registr|cadastr|adicion).*(categoria|categorias)/i,
      /como\s+(gerenciar|editar|alterar|mudar|configurar|personalizar|ver|usar|criar|registrar|cadastrar|adicionar)\s+(as\s+|uma\s+|minhas\s+)?categoria/i,
      /onde\s+(fica|estao|ficam|encontro|adiciono|crio|cadastro)\s+(as\s+|uma\s+|minhas\s+)?categoria/i,
    ],
  },
  {
    id: 'view-dashboard',
    patterns: [
      /como\s+(vejo|uso|acesso|encontro).*(dashboard|painel|relatorio|relatório|relatorios|relatórios|grafico|gráfico|graficos|gráficos)/i,
      /como\s+(faco|faço)\s+para\s+(ver|usar|acess).*(dashboard|painel|relatorio|relatório|relatorios|relatórios)/i,
      /como\s+(ver|usar|acessar)\s+(o\s+)?(meu\s+)?(dashboard|painel|relatorio|relatório|relatorios|relatórios)/i,
      /onde\s+(fica|esta|está|ficam|estao|estão)\s+(o\s+|os\s+)?(dashboard|painel|relatorio|relatório|relatorios|relatórios)/i,
    ],
  },
  {
    id: 'profile-settings',
    patterns: [
      /como\s+(mudo|altero|troco|configuro|edito).*(perfil|foto|avatar|nome)/i,
      /como\s+(faco|faço)\s+para\s+(mudar|alterar|trocar|editar).*(perfil|foto|avatar|nome)/i,
      /como\s+(mudar|alterar|trocar|configurar|editar)\s+(o\s+|meu\s+|minha\s+)?(perfil|foto|avatar|nome)/i,
      /onde\s+(fica|esta|está|altero|mudo)\s+(o\s+|meu\s+|minha\s+)?(perfil|configuracoes|configurações)/i,
    ],
  },
  {
    id: 'view-upgrade',
    patterns: [
      /como\s+(assino|contrato|compro|ativo|pago).*(pro|premium|plano)/i,
      /como\s+(faco|faço)\s+para\s+(assin|contrat|compr|ativ|pag).*(pro|premium|plano)/i,
      /como\s+(assinar|contratar|comprar|ativar|pagar)\s+(o\s+)?(pro|premium|plano)/i,
      /onde\s+(fica|esta|está|assino|pago)\s+(o\s+)?(pro|premium|plano|upgrade)/i,
      /como\s+(faco|faço)\s+(upgrade|pro)/i,
      /quero\s+(ser|virar|ficar)\s+(pro|premium)/i,
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
