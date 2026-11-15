import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LANG_STORAGE_KEY, detectLanguage, translate, type Lang, type MessageKey } from './i18n'
import { I18nContext } from './useI18n'

function initialLanguage(): Lang {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(LANG_STORAGE_KEY)
  } catch {
    // Sin almacenamiento: se usa el idioma del sistema.
  }
  const system = typeof navigator === 'undefined' ? [] : (navigator.languages?.length ? navigator.languages : [navigator.language])
  return detectLanguage(saved, system)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      // El cambio sigue valiendo mientras la app esté abierta.
    }
  }, [])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: MessageKey, params?: Record<string, string | number>) => translate(lang, key, params),
    }),
    [lang, setLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
