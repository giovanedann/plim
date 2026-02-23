import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ExportableTable, accountService } from '@/services/account.service'

interface ExportButtonProps {
  table: ExportableTable
  label: string
}

function ExportButton({ table, label }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleExport(): Promise<void> {
    setIsLoading(true)
    try {
      const result = await accountService.exportData(table)
      if (result.success) {
        toast.success('Dados exportados com sucesso')
      } else {
        toast.error(result.error || 'Erro ao exportar dados')
      }
    } catch {
      toast.error('Erro ao exportar dados')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start"
      onClick={handleExport}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  )
}

export function DataExportSection() {
  return (
    <Card data-tutorial-id="profile-data-export">
      <CardHeader>
        <CardTitle>Exportar Dados</CardTitle>
        <CardDescription>
          Baixe uma cópia dos seus dados em formato CSV. Você pode exportar cada tipo de dado uma
          vez por semana.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <ExportButton table="profile" label="Exportar Perfil" />
        <ExportButton table="expenses" label="Exportar Transações" />
        <ExportButton table="categories" label="Exportar Categorias" />
        <ExportButton table="credit-cards" label="Exportar Cartões" />
        <ExportButton table="salary-history" label="Exportar Histórico de Salário" />
      </CardContent>
    </Card>
  )
}
