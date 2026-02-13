import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { logger } from '@/lib/logger'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    logger?.error('ErrorBoundary caught an error', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl font-bold text-primary">P</span>
              </div>
              <h1 className="text-2xl font-semibold">Algo deu errado</h1>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado. Por favor, tente novamente.
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button onClick={this.handleGoHome}>Ir para o inicio</Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
