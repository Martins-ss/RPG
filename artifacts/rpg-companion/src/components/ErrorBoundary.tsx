import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error);
    console.error('[ErrorBoundary] Info:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleClearData = () => {
    localStorage.removeItem('reino-rei-sombrio');
    localStorage.removeItem('reino-rei-sombrio-bosses');
    localStorage.removeItem('reino-rei-sombrio-tabuleiro');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#12121a] rounded-xl p-6 border border-red-900/30 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-red-400 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
              Erro na Aplicação
            </h1>
            <p className="text-sm text-gray-400 mb-4">
              Algo deu errado. Tente recarregar a página ou limpar os dados.
            </p>
            {this.state.error && (
              <div className="bg-black/30 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-red-300 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                🔄 Recarregar
              </button>
              <button
                onClick={this.handleClearData}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                🗑️ Limpar Dados
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
