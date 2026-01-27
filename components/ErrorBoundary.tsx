
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
                        <span className="material-symbols-outlined text-4xl text-red-500 mb-4">error</span>
                        <h2 className="text-xl font-bold text-red-800 mb-2">Algo deu errado</h2>
                        <p className="text-red-600 mb-4 text-sm">Ocorreu um erro ao carregar esta visualização.</p>
                        <div className="bg-white p-4 rounded border border-red-100 text-left overflow-auto max-h-40 mb-6">
                            <code className="text-[10px] text-red-500 font-mono break-all block">
                                {this.state.error?.message}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
