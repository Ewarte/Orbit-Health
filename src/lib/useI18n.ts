import { createContext, useContext } from 'react'
import { translate, type Lang, type MessageKey } from './i18n'

export interface I18n {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: MessageKey, params?: Record<string, string | number>) => string
}

/** Valor por defecto: español, para que un componente fuera del proveedor no falle. */
export const I18nContext = createContext<I18n>({
  lang: 'es',
  setLang: () => {},
  t: (key, params) => translate('es', key, params),
})

export function useI18n(): I18n {
  return useContext(I18nContext)
}
