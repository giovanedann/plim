import { type Tutorial, registerTutorials } from '@/stores/tutorial.store'

export const TUTORIALS: Tutorial[] = [
  {
    id: 'add-expense',
    title: 'Como adicionar uma despesa',
    description: 'Aprenda a registrar suas despesas no Plim',
    steps: [
      {
        elementId: 'sidebar-nav-expenses',
        title: 'Acesse a página de despesas',
        description: 'Clique em "Despesas" no menu lateral para acessar a página de despesas.',
        action: 'navigate',
      },
      {
        elementId: 'expense-add-button',
        title: 'Clique em adicionar',
        description: 'Clique no botão "Adicionar despesa" para abrir o formulário de criação.',
        action: 'click',
      },
      {
        elementId: 'expense-filters',
        title: 'Use os filtros',
        description:
          'Você pode filtrar suas despesas por mês, categoria ou método de pagamento para encontrar o que procura.',
        action: 'observe',
      },
      {
        elementId: 'expense-list',
        title: 'Veja suas despesas',
        description:
          'Aqui ficam listadas todas as suas despesas. Você pode clicar em uma despesa para editar ou excluir.',
        action: 'observe',
      },
      {
        elementId: 'expense-monthly-total',
        title: 'Acompanhe seu total mensal',
        description:
          'Aqui você vê o total gasto no mês atual e a comparação com seu salário cadastrado.',
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
        title: 'Acesse a página de categorias',
        description: 'Clique em "Categorias" no menu lateral para gerenciar suas categorias.',
        action: 'navigate',
      },
      {
        elementId: 'category-list',
        title: 'Veja suas categorias',
        description:
          'Aqui ficam listadas todas as suas categorias. Você pode clicar em uma para editar.',
        action: 'observe',
      },
      {
        elementId: 'category-add-button',
        title: 'Crie uma nova categoria',
        description:
          'Clique no botão "Adicionar" para criar uma nova categoria com nome, ícone e cor personalizados.',
        action: 'click',
      },
      {
        elementId: 'category-list',
        title: 'Edite ou exclua categorias',
        description:
          'Clique em uma categoria existente para editar seu nome, ícone ou cor. Você também pode excluí-la.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-expenses',
        title: 'Use nas despesas',
        description:
          'Suas categorias aparecem ao criar ou editar uma despesa. Organize suas finanças do seu jeito!',
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
        title: 'Acesse a página de cartões',
        description: 'Clique em "Cartões de Crédito" no menu lateral para gerenciar seus cartões.',
        action: 'navigate',
      },
      {
        elementId: 'sidebar-nav-credit-cards',
        title: 'Adicione um cartão',
        description:
          'Na página de cartões, clique em "Adicionar cartão" e preencha o nome, data de vencimento e data de fechamento.',
        action: 'observe',
      },
      {
        elementId: 'sidebar-nav-expenses',
        title: 'Use o cartão nas despesas',
        description:
          'Ao criar uma despesa, selecione "Cartão de crédito" como método de pagamento e escolha seu cartão.',
        action: 'observe',
      },
      {
        elementId: 'expense-add-button',
        title: 'Parcele suas compras',
        description:
          'Ao adicionar uma despesa com cartão de crédito, você pode definir o número de parcelas. O Plim calcula automaticamente!',
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
        title: 'Acesse o dashboard',
        description: 'Clique em "Dashboard" no menu lateral para ver sua visão geral financeira.',
        action: 'navigate',
      },
      {
        elementId: 'dashboard-summary-cards',
        title: 'Resumo financeiro',
        description:
          'Os cards de resumo mostram seus gastos totais, salário e saldo do mês atual de forma rápida.',
        action: 'observe',
      },
      {
        elementId: 'dashboard-charts',
        title: 'Gráficos de gastos',
        description:
          'Os gráficos mostram seus gastos por categoria, método de pagamento e evolução mensal.',
        action: 'observe',
      },
      {
        elementId: 'dashboard-charts',
        title: 'Tendências e comparações',
        description:
          'Acompanhe a evolução dos seus gastos ao longo dos meses e identifique padrões.',
        action: 'observe',
      },
      {
        elementId: 'dashboard-summary-cards',
        title: 'Filtre por período',
        description:
          'Use o seletor de mês para navegar entre diferentes períodos e comparar seus gastos.',
        action: 'observe',
      },
    ],
  },
]

export function getTutorialConfig(id: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.id === id)
}

registerTutorials(TUTORIALS)
