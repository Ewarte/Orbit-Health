import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nProvider } from '../lib/I18nProvider'
import { LANG_STORAGE_KEY, detectLanguage, localizePlace, messages, translate } from '../lib/i18n'
import { RoutinePage } from '../features/mission/RoutinePage'
import { MissionPage } from '../features/mission/MissionPage'
import { AppShell } from '../components/layout/AppShell'
import {
  ROUTINE_STORAGE_KEY,
  dayKey,
  dueReminders,
  emptyDay,
  parseEnabledReminders,
  parseRoutineDay,
} from '../features/mission/routineLogic'

const at = (hours: number, minutes: number) => new Date(2026, 10, 15, hours, minutes)

describe('idiomas', () => {
  it('los dos idiomas tienen las mismas claves y ningún texto vacío', () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.es).sort())
    for (const lang of ['es', 'en'] as const) {
      for (const text of Object.values(messages[lang])) expect(text.trim()).not.toBe('')
    }
  })

  it('elige español salvo que el sistema sea inglés o la persona haya elegido otro', () => {
    expect(detectLanguage(null, ['es-MX'])).toBe('es')
    expect(detectLanguage(null, ['fr-FR'])).toBe('es')
    expect(detectLanguage(null, [])).toBe('es')
    expect(detectLanguage(null, ['en-US'])).toBe('en')
    expect(detectLanguage('es', ['en-US'])).toBe('es')
    expect(detectLanguage('en', ['es-MX'])).toBe('en')
    expect(detectLanguage('de', ['en-US'])).toBe('en')
  })

  it('traduce la ubicación de la simulación y respeta cualquier otra', () => {
    expect(localizePlace('Lunar transit', 'es')).toBe('Tránsito lunar')
    expect(localizePlace('Tránsito lunar', 'en')).toBe('Lunar transit')
    expect(localizePlace('Estación Gateway', 'en')).toBe('Estación Gateway')
  })

  it('rellena los huecos del texto', () => {
    expect(translate('es', 'routine.progress', { done: 2, total: 4 })).toBe('2 de 4 completadas')
    expect(translate('en', 'routine.progress', { done: 2, total: 4 })).toBe('2 of 4 complete')
  })
})

describe('lógica de la rutina', () => {
  it('descarta lo guardado de otro día, dañado o en el formato antiguo', () => {
    const today = at(8, 0)
    expect(parseRoutineDay(null, today)).toEqual(emptyDay(today))
    expect(parseRoutineDay('no es json', today)).toEqual(emptyDay(today))
    expect(parseRoutineDay('["check"]', today)).toEqual(emptyDay(today))
    expect(parseRoutineDay(JSON.stringify({ date: '2020-01-01', done: ['check'], dismissed: [] }), today)).toEqual(emptyDay(today))
  })

  it('conserva lo de hoy y filtra ids desconocidos', () => {
    const today = at(8, 0)
    const raw = JSON.stringify({ date: dayKey(today), done: ['check', 'otra'], dismissed: ['sleep'] })
    expect(parseRoutineDay(raw, today)).toEqual({ date: dayKey(today), done: ['check'], dismissed: ['sleep'] })
  })

  it('activa todos los recordatorios por defecto', () => {
    expect(parseEnabledReminders(null)).toEqual(['check', 'exercise', 'review', 'sleep'])
    expect(parseEnabledReminders('[]')).toEqual([])
  })

  it('avisa solo en la hora de la tarea y dentro de la ventana', () => {
    const day = emptyDay(at(7, 0))
    const all = ['check', 'exercise', 'review', 'sleep'] as const
    expect(dueReminders(at(7, 9), day, all)).toEqual([])
    expect(dueReminders(at(7, 10), day, all).map((task) => task.id)).toEqual(['check'])
    expect(dueReminders(at(8, 9), day, all).map((task) => task.id)).toEqual(['check'])
    expect(dueReminders(at(8, 10), day, all)).toEqual([])
  })

  it('no avisa si está hecha, ya se cerró el aviso o el recordatorio está apagado', () => {
    const base = emptyDay(at(7, 0))
    expect(dueReminders(at(7, 10), { ...base, done: ['check'] }, ['check'])).toEqual([])
    expect(dueReminders(at(7, 10), { ...base, dismissed: ['check'] }, ['check'])).toEqual([])
    expect(dueReminders(at(7, 10), base, ['exercise'])).toEqual([])
  })
})

describe('pantallas', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-MX'])
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(at(6, 0))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const renderRoutine = () =>
    render(
      <I18nProvider>
        <RoutinePage />
      </I18nProvider>,
    )

  it('muestra la rutina en español por defecto', () => {
    renderRoutine()
    expect(screen.getByText('Rutina de hoy')).toBeTruthy()
    expect(screen.getByText('0 de 4 completadas')).toBeTruthy()
  })

  it('muestra la rutina en inglés si el idioma guardado es inglés', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'en')
    renderRoutine()
    expect(screen.getByText('Today’s routine')).toBeTruthy()
    expect(screen.getByText('0 of 4 complete')).toBeTruthy()
  })

  it('marca una tarea, la guarda y reinicia', () => {
    renderRoutine()
    fireEvent.click(screen.getByText('Completar el chequeo diario de salud'))
    expect(screen.getByText('1 de 4 completadas')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(ROUTINE_STORAGE_KEY)!).done).toEqual(['check'])
    fireEvent.click(screen.getByText('Reiniciar'))
    expect(screen.getByText('0 de 4 completadas')).toBeTruthy()
  })

  it('muestra el aviso cuando llega la hora y se puede cerrar', () => {
    renderRoutine()
    expect(screen.queryByRole('alert')).toBeNull()
    act(() => {
      vi.setSystemTime(at(7, 10))
      vi.advanceTimersByTime(30_000)
    })
    expect(screen.getByRole('alert').textContent).toContain('Completar el chequeo diario de salud')
    fireEvent.click(screen.getByText('Entendido'))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('no avisa de una tarea con el recordatorio apagado', () => {
    renderRoutine()
    fireEvent.click(screen.getByLabelText(/Recordatorio activado para «Completar el chequeo diario de salud»/))
    act(() => {
      vi.setSystemTime(at(7, 10))
      vi.advanceTimersByTime(30_000)
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('el botón cambia el idioma de la navegación y lo recuerda', () => {
    const nav = [{ id: 'routine', label: 'x', ready: true }]
    render(
      <I18nProvider>
        <AppShell nav={nav} current="routine" onNavigate={() => {}}>
          <RoutinePage />
        </AppShell>
      </I18nProvider>,
    )
    expect(screen.getByText('Salud de la tripulación')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a inglés' }))
    expect(screen.getByText('Crew health')).toBeTruthy()
    expect(screen.getByText('Today’s routine')).toBeTruthy()
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('Misión guarda el día y se muestra en español', () => {
    const onSave = vi.fn()
    render(
      <I18nProvider>
        <MissionPage
          mission={{ environment: 'station', launchUtc: '2026-09-30T06:00:00.000Z', day: 47, place: 'Lunar transit', lastCheck: '07:10' }}
          onSave={onSave}
        />
      </I18nProvider>,
    )
    expect(screen.getByText('Contexto de la misión')).toBeTruthy()
    fireEvent.click(screen.getByText('Guardar misión'))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ environment: 'station', launchUtc: '2026-09-30T06:00:00.000Z', place: 'Lunar transit' }),
    )
    expect(screen.getByRole('status').textContent).toContain('guardado')
  })
})
