import { Component, type ReactNode } from 'react'
import { useI18n } from '../../lib/useI18n'

interface Props {
  children: ReactNode
  /** Qué hacer al pulsar «Volver a Hoy» (la app navega a la pantalla Hoy). */
  onReset: () => void
}

interface State {
  failed: boolean
}

/** Red de seguridad: si una pantalla falla al dibujarse, muestra un aviso en vez de dejar la app en blanco. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Error de pantalla:', error)
  }

  private reset = () => {
    this.setState({ failed: false })
    this.props.onReset()
  }

  render() {
    return this.state.failed ? <ErrorScreen onReset={this.reset} /> : this.props.children
  }
}

function ErrorScreen({ onReset }: { onReset: () => void }) {
  const { t } = useI18n()
  return (
    <main role="alert" className="min-w-0 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-act bg-panel p-6 text-center">
        <h1 className="m-0 font-display text-2xl font-semibold text-text">{t('error.title')}</h1>
        <p className="mb-0 mt-2 text-mute">{t('error.body')}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-5 min-h-11 cursor-pointer rounded-lg border-2 border-ok bg-notice px-5 py-2 font-semibold text-ok hover:brightness-110"
        >
          {t('error.backToToday')}
        </button>
      </div>
    </main>
  )
}
