import { type Tutorial, registerTutorials } from '@/stores/tutorial.store'

export const TUTORIALS: Tutorial[] = [
  {
    id: 'add-expense',
    title: 'Como adicionar uma despesa',
    description: 'Aprenda a registrar suas despesas no Plim',
    steps: [
      {
        elementId: 'sidebar-nav-expenses',
        title: 'Página de Despesas',
        description: 'Clique em "Despesas" no menu lateral para acessar a página de despesas.',
        action: 'navigate',
        navigateTo: '/expenses',
      },
      {
        elementId: 'expense-add-button',
        title: 'Criar uma despesa',
        description:
          'Use este botão para registrar uma nova despesa. Preencha o valor, categoria e método de pagamento.',
        action: 'click',
      },
      {
        elementId: 'expense-list',
        title: 'Editar ou excluir',
        description:
          'Clique em qualquer despesa da lista para editar ou excluir. Você pode alterar valor, categoria e outros detalhes.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-expenses',
        title: 'Pronto!',
        description: 'Agora é só registrar suas despesas e acompanhar seus gastos por aqui!',
        action: 'observe',
      },
    ],
  },
  {
    id: 'manage-categories',
    title: 'Como gerenciar categorias',
    description: 'Aprenda a criar e organizar suas categorias de despesas',
    steps: [
      {
        elementId: 'sidebar-nav-categories',
        title: 'Página de Categorias',
        description: 'Clique em "Categorias" no menu lateral para gerenciar suas categorias.',
        action: 'navigate',
        navigateTo: '/categories',
      },
      {
        elementId: 'category-add-button',
        title: 'Criar uma categoria',
        description:
          'Use este botão para criar uma nova categoria com nome, ícone e cor personalizados.',
        action: 'click',
      },
      {
        elementId: 'category-list',
        title: 'Editar ou excluir',
        description:
          'Clique em qualquer categoria para editar seu nome, ícone ou cor. Você também pode excluí-la pelo menu de opções.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-categories',
        title: 'Pronto!',
        description:
          'Agora é só usar suas categorias personalizadas quando for registrar uma despesa!',
        action: 'observe',
      },
    ],
  },
  {
    id: 'setup-credit-card',
    title: 'Como configurar um cartão de crédito',
    description: 'Aprenda a cadastrar cartões de crédito para controlar parcelas',
    steps: [
      {
        elementId: 'sidebar-nav-credit-cards',
        title: 'Página de Cartões',
        description: 'Clique em "Cartões" no menu lateral para gerenciar seus cartões de crédito.',
        action: 'navigate',
        navigateTo: '/credit-cards',
      },
      {
        elementId: 'credit-card-add-button',
        title: 'Criar um cartão',
        description:
          'Use este botão para cadastrar um novo cartão. Preencha o nome, bandeira e datas de vencimento e fechamento.',
        action: 'click',
      },
      {
        elementId: 'credit-card-list',
        title: 'Editar ou excluir',
        description:
          'Clique no menu (\u22EE) de qualquer cartão para editar seus dados ou excluí-lo.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-credit-cards',
        title: 'Pronto!',
        description: 'Agora é só usar esse cartão quando for registrar uma despesa!',
        action: 'observe',
      },
    ],
  },
  {
    id: 'view-dashboard',
    title: 'Como usar o dashboard',
    description: 'Entenda o painel de visão geral das suas finanças',
    steps: [
      {
        elementId: 'sidebar-nav-dashboard',
        title: 'Página do Dashboard',
        description: 'Clique em "Dashboard" no menu lateral para ver sua visão geral financeira.',
        action: 'navigate',
        navigateTo: '/dashboard',
      },
      {
        elementId: 'dashboard-summary-cards',
        title: 'Resumo financeiro',
        description:
          'Estes cards mostram seus gastos totais, receita e saldo do mês atual de forma rápida.',
        action: 'observe',
      },
      {
        elementId: 'dashboard-charts',
        title: 'Gráficos e análises',
        description:
          'Os gráficos mostram seus gastos por categoria, método de pagamento e a evolução ao longo dos meses.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-dashboard',
        title: 'Pronto!',
        description:
          'Use o dashboard para acompanhar suas finanças e identificar padrões nos seus gastos!',
        action: 'observe',
      },
    ],
  },
  {
    id: 'profile-settings',
    title: 'Como editar seu perfil',
    description: 'Aprenda a alterar sua foto, nome e preferências',
    steps: [
      {
        elementId: 'profile-settings-form',
        title: 'Suas informações',
        description:
          'Aqui você encontra seus dados pessoais e preferências como moeda e idioma. Clique no ícone de lápis para editar.',
        action: 'observe',
        navigateTo: '/profile',
      },
      {
        elementId: 'profile-avatar-section',
        title: 'Foto de perfil',
        description:
          'Clique no ícone da câmera para alterar sua foto de perfil. Você pode enviar uma imagem JPG, PNG ou WebP.',
        action: 'click',
      },
      {
        elementId: 'profile-data-export',
        title: 'Exportar dados',
        description:
          'Baixe uma cópia dos seus dados a qualquer momento em formato CSV. Você pode exportar despesas, categorias e mais.',
        action: 'observe',
      },
      {
        elementId: 'profile-settings-form',
        title: 'Pronto!',
        description:
          'Agora é só personalizar seu perfil e manter suas informações sempre atualizadas!',
        action: 'observe',
      },
    ],
  },
  {
    id: 'view-upgrade',
    title: 'Como assinar o plano Pro',
    description: 'Conheça os benefícios do plano Pro e como assinar',
    steps: [
      {
        elementId: 'upgrade-plan-card',
        title: 'Plano Pro',
        description:
          'Aqui você vê os detalhes do plano Pro e todos os benefícios inclusos: categorias ilimitadas, mais IA e dashboard completo.',
        action: 'observe',
        navigateTo: '/upgrade',
      },
      {
        elementId: 'upgrade-payment-button',
        title: 'Pagar com PIX',
        description:
          'Clique neste botão para gerar um QR Code PIX. O pagamento é único, válido por 30 dias, sem renovação automática.',
        action: 'click',
      },
      {
        elementId: 'upgrade-plan-card',
        title: 'Pronto!',
        description:
          'Após o pagamento, seus benefícios Pro são ativados automaticamente. Aproveite!',
        action: 'observe',
      },
    ],
  },
]

export function getTutorialConfig(id: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.id === id)
}

registerTutorials(TUTORIALS)
