"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Import translation files
import enTranslations from '../public/locales/en/common.json'
import msTranslations from '../public/locales/ms/common.json'

type Language = 'en' | 'ms'
type Translations = typeof enTranslations

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string> | string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Translations> = {
  en: enTranslations,
  ms: msTranslations,
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ms')) {
      setLanguageState(savedLanguage)
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0]
      if (browserLang === 'ms') {
        setLanguageState('ms')
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string, params?: Record<string, string> | string): string => {
    const keys = key.split('.')
    let value: any = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    if (typeof value === 'string') {
      // Handle interpolation if params are provided
      if (params && typeof params === 'object') {
        return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
          return result.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue)
        }, value)
      }
      return value
    }

    // Try English fallback if current language doesn't have the key
    if (language !== 'en') {
      let enValue: any = translations.en
      for (const k of keys) {
        enValue = enValue?.[k]
      }
      if (typeof enValue === 'string') {
        // Handle interpolation for fallback too
        if (params && typeof params === 'object') {
          return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
            return result.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue)
          }, enValue)
        }
        return enValue
      }
    }

    // Handle fallback parameter (for backward compatibility)
    if (typeof params === 'string') {
      return params
    }

    return key
  }

  const value = {
    language,
    setLanguage,
    t,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
