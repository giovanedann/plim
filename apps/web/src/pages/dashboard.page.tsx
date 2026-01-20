export function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <p className="text-sm text-muted-foreground">Visão geral das suas finanças pessoais</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 lg:px-6">
        <p className="text-muted-foreground">Em breve: gráficos e resumo financeiro</p>
      </div>
    </div>
  )
}
