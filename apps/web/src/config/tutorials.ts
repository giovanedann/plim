import { type Tutorial, registerTutorials } from '@/stores/tutorial.store'

export const TUTORIALS: Tutorial[] = [
  {
    id: 'add-expense',
    title: 'Como adicionar uma transação',
    description: 'Aprenda a registrar despesas e receitas no Plim',
    steps: [
      {
        elementId: 'sidebar-nav-expenses',
        title: 'Página de Transações',
        description:
          'Aqui é onde você registra tudo o que entra e sai do seu bolso. Clique em "Transações" no menu lateral para acessar.',
        action: 'navigate',
        navigateTo: '/transactions',
      },
      {
        elementId: 'expense-add-button',
        title: 'Criar uma transação',
        description:
          'Use este botão para registrar uma nova despesa ou receita. Escolha o tipo (Único, Recorrente ou Parcelado), preencha o valor, categoria e método de pagamento. Alterne entre Despesa e Receita no topo do formulário.',
        action: 'click',
      },
      {
        elementId: 'expense-monthly-total',
        title: 'Resumo mensal',
        description:
          'Este painel mostra o total de despesas e receitas do mês selecionado. Use-o para acompanhar rapidamente se está gastando mais do que ganha.',
        action: 'observe',
      },
      {
        elementId: 'expense-list',
        title: 'Lista de transações',
        description:
          'Aqui você vê todas as transações do mês. Despesas aparecem em vermelho e receitas em verde. Clique em qualquer item para editar ou excluir.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-expenses',
        title: 'Pronto!',
        description:
          'Agora é só registrar suas despesas e receitas regularmente. Quanto mais consistente, melhor será sua visão financeira!',
        action: 'observe',
      },
    ],
  },
  {
    id: 'manage-categories',
    title: 'Como gerenciar categorias',
    description: 'Aprenda a criar e organizar suas categorias de transações',
    steps: [
      {
        elementId: 'sidebar-nav-categories',
        title: 'Página de Categorias',
        description:
          'Categorias organizam suas transações e alimentam os gráficos do dashboard. No plano gratuito você pode criar até 5 categorias personalizadas; no Pro, ilimitadas. Clique em "Categorias" para acessar.',
        action: 'navigate',
        navigateTo: '/categories',
      },
      {
        elementId: 'category-add-button',
        title: 'Criar uma categoria',
        description:
          'Use este botão para criar uma nova categoria. Escolha entre 54 ícones e 12 cores para identificar rapidamente seus gastos nos gráficos e na lista de transações.',
        action: 'click',
      },
      {
        elementId: 'category-list',
        title: 'Categorias do sistema e personalizadas',
        description:
          'As categorias padrão do sistema não podem ser excluídas, mas suas categorias personalizadas podem ser editadas ou removidas a qualquer momento pelo menu de opções.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-categories',
        title: 'Pronto!',
        description:
          'Agora é só usar suas categorias ao registrar transações. Elas vão aparecer nos gráficos do dashboard para você visualizar seus padrões de gasto!',
        action: 'observe',
      },
    ],
  },
  {
    id: 'setup-credit-card',
    title: 'Como configurar um cartão de crédito',
    description: 'Aprenda a cadastrar cartões de crédito para controlar parcelas e faturas',
    steps: [
      {
        elementId: 'sidebar-nav-credit-cards',
        title: 'Página de Cartões',
        description:
          'Cadastre seus cartões de crédito para controlar parcelas e faturas. No plano gratuito você pode ter até 2 cartões; no Pro, ilimitados. Clique em "Cartões" para acessar.',
        action: 'navigate',
        navigateTo: '/credit-cards',
      },
      {
        elementId: 'credit-card-add-button',
        title: 'Criar um cartão',
        description:
          'Preencha o nome, bandeira, dia de fechamento, dia de vencimento e limite de crédito. O dia de fechamento determina o ciclo das faturas.',
        action: 'click',
      },
      {
        elementId: 'credit-card-list',
        title: 'Limite e faturas',
        description:
          'Cada cartão exibe o uso do limite. Cartões com dia de fechamento geram faturas automaticamente — recurso exclusivo do plano Pro, onde você acompanha o saldo restante mês a mês.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-credit-cards',
        title: 'Vincule às transações',
        description:
          'Ao registrar uma despesa parcelada, selecione o cartão de crédito como forma de pagamento. As parcelas serão distribuídas automaticamente nas faturas correspondentes.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-credit-cards',
        title: 'Pronto!',
        description:
          'Agora é só usar esse cartão quando for registrar transações parceladas. Suas faturas e limites serão atualizados automaticamente!',
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
        description:
          'O dashboard é o centro de comando das suas finanças. Aqui você visualiza resumos, gráficos e tendências. Clique em "Dashboard" para acessar.',
        action: 'navigate',
        navigateTo: '/dashboard',
      },
      {
        elementId: 'dashboard-summary-cards',
        title: 'Cards de resumo',
        description:
          'Estes cards mostram rapidamente o total de despesas, receitas e saldo do mês. Use-os para ter uma visão instantânea da sua saúde financeira.',
        action: 'observe',
      },
      {
        elementId: 'dashboard-charts',
        title: 'Gráficos gratuitos',
        description:
          'No plano gratuito, você tem acesso aos gráficos de evolução mensal, gastos por categoria e gastos por forma de pagamento — tudo nos últimos 30 dias.',
        action: 'observe',
      },
      {
        elementId: 'dashboard-charts',
        title: 'Gráficos Pro',
        description:
          'No plano Pro, você desbloqueia gráficos avançados: Receita vs Despesas, Taxa de Economia, Gastos por Cartão, Top Categorias, Evolução do Salário e Previsão de Parcelas. Além disso, pode visualizar períodos maiores (3, 6 e 12 meses).',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-dashboard',
        title: 'Pronto!',
        description:
          'Use o dashboard para acompanhar suas finanças e identificar padrões. Quanto mais transações você registrar, mais úteis ficam os gráficos!',
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
          'Aqui você encontra seus dados pessoais e preferências como moeda e idioma. Mantenha seu salário atualizado para que os gráficos do dashboard sejam mais precisos.',
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
          'Baixe uma cópia dos seus dados a qualquer momento em formato CSV. Você pode exportar transações, categorias e mais. Seus dados são sempre seus.',
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
          'O plano Pro desbloqueia categorias ilimitadas, cartões ilimitados, faturas com controle de saldo, dashboard com gráficos avançados e mais requisições de IA (texto, imagem e voz).',
        action: 'observe',
        navigateTo: '/upgrade',
      },
      {
        elementId: 'upgrade-payment-button',
        title: 'Pagar com PIX',
        description:
          'O pagamento é feito via PIX por R$ 10,00. É válido por 30 dias e não tem renovação automática — você renova só quando quiser.',
        action: 'click',
      },
      {
        elementId: 'upgrade-plan-card',
        title: 'Pronto!',
        description:
          'Após o pagamento ser confirmado, seus benefícios Pro são ativados automaticamente. Aproveite todos os recursos!',
        action: 'observe',
      },
    ],
  },
  {
    id: 'view-invoices',
    title: 'Como acompanhar faturas',
    description: 'Entenda como funcionam as faturas de cartão de crédito (recurso Pro)',
    steps: [
      {
        elementId: 'sidebar-nav-invoices',
        title: 'Faturas (Pro)',
        description:
          'As faturas são um recurso exclusivo do plano Pro. Elas representam o extrato mensal de cada cartão de crédito, com todas as compras do período de fechamento. Clique em "Faturas" para acessar.',
        action: 'navigate',
        navigateTo: '/invoices',
      },
      {
        elementId: 'invoice-card-selector',
        title: 'Selecione um cartão',
        description:
          'Escolha o cartão que deseja visualizar. Apenas cartões com dia de fechamento configurado geram faturas automaticamente.',
        action: 'observe',
      },
      {
        elementId: 'invoice-summary-card',
        title: 'Resumo da fatura',
        description:
          'Aqui você vê o total de compras, valor já pago, saldo anterior (se houver) e o restante a pagar. Acompanhe mês a mês para nunca perder o controle.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-invoices',
        title: 'Pronto!',
        description:
          'Use o botão "Pagar fatura" para registrar pagamentos parciais ou totais. O saldo restante é transferido automaticamente para a próxima fatura.',
        action: 'observe',
      },
    ],
  },
  {
    id: 'add-income',
    title: 'Como registrar receitas',
    description: 'Aprenda a registrar salários e outras receitas no Plim',
    steps: [
      {
        elementId: 'sidebar-nav-expenses',
        title: 'Receitas ficam em Transações',
        description:
          'As receitas são registradas na mesma página de Transações. Não existe uma página separada — tudo fica centralizado em um só lugar. Clique em "Transações" para acessar.',
        action: 'navigate',
        navigateTo: '/transactions',
      },
      {
        elementId: 'expense-add-button',
        title: 'Alternar para Receita',
        description:
          'Ao abrir o formulário, alterne de "Despesa" para "Receita" no topo. Preencha o valor, descrição e categoria. Receitas podem ser únicas ou recorrentes (como seu salário mensal).',
        action: 'click',
      },
      {
        elementId: 'expense-monthly-total',
        title: 'Resumo atualizado',
        description:
          'Suas receitas aparecem no resumo mensal e alimentam os gráficos do dashboard, incluindo os gráficos Pro de Receita vs Despesas e Taxa de Economia.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-expenses',
        title: 'Pronto!',
        description:
          'Registre suas receitas regularmente — salário, freelances, rendimentos. Quanto mais completo, melhor será o panorama das suas finanças!',
        action: 'observe',
      },
    ],
  },
]

export function getTutorialConfig(id: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.id === id)
}

registerTutorials(TUTORIALS)
