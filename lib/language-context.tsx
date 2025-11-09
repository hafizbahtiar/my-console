"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

type Language = 'en' | 'ms'
type Translations = Record<string, any>

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string, params?: Record<string, string | number>) => string
    loading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useTranslation() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider')
    }
    return context
}

interface LanguageProviderProps {
    children: ReactNode
}

const STORAGE_KEY = 'app_language'
const DEFAULT_LANGUAGE: Language = 'en'
const SUPPORTED_LANGUAGES: Language[] = ['en', 'ms']

/**
 * Get nested value from object using dot notation
 * Example: getNestedValue(obj, 'auth_modules.password_reset')
 */
function getNestedValue(obj: any, path: string): string | undefined {
    if (!obj || typeof obj !== 'object') {
        return undefined
    }

    const keys = path.split('.')
    let current: any = obj

    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined
        }
        current = current[key]
    }

    return typeof current === 'string' ? current : undefined
}

/**
 * Replace template variables in translation string
 * Example: replaceTemplate('Hello {{name}}', { name: 'John' }) => 'Hello John'
 */
function replaceTemplate(template: string, params?: Record<string, string | number>): string {
    if (!params || Object.keys(params).length === 0) {
        return template
    }

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key] !== undefined ? String(params[key]) : match
    })
}

/**
 * Detect browser language and return supported language code
 */
function detectBrowserLanguage(): Language {
    if (typeof window === 'undefined') {
        return DEFAULT_LANGUAGE
    }

    try {
        const browserLang = navigator.language || (navigator as any).userLanguage
        const langCode = browserLang.split('-')[0].toLowerCase()

        if (SUPPORTED_LANGUAGES.includes(langCode as Language)) {
            return langCode as Language
        }
    } catch (error) {
        console.warn('Failed to detect browser language:', error)
    }

    return DEFAULT_LANGUAGE
}

/**
 * Load translations from JSON file
 * Uses cache busting to ensure fresh translations are always loaded
 */
async function loadTranslations(language: Language): Promise<Translations> {
    try {
        // Add cache busting query parameter to ensure fresh translations
        // This works with Network First strategy in service worker
        const cacheBuster = `?v=${Date.now()}`
        const response = await fetch(`/locales/${language}/common.json${cacheBuster}`, {
            cache: 'no-store', // Prevent browser caching
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
            }
        })
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${language}`)
        }
        const translations = await response.json()
        return translations
    } catch (error) {
        console.error(`Error loading translations for ${language}:`, error)

        // Fallback to English if current language fails
        if (language !== DEFAULT_LANGUAGE) {
            try {
                const cacheBuster = `?v=${Date.now()}`
                const fallbackResponse = await fetch(`/locales/${DEFAULT_LANGUAGE}/common.json${cacheBuster}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                    }
                })
                if (fallbackResponse.ok) {
                    return await fallbackResponse.json()
                }
            } catch (fallbackError) {
                console.error('Failed to load fallback translations:', fallbackError)
            }
        }

        // Return empty object as last resort
        return {}
    }
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE)
    const [translations, setTranslations] = useState<Translations>({})
    const [fallbackTranslations, setFallbackTranslations] = useState<Translations>({})
    const [loading, setLoading] = useState(true)
    const [isInitialized, setIsInitialized] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isClient, setIsClient] = useState(false)
    const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null)
    const [pendingTranslations, setPendingTranslations] = useState<Translations | null>(null)
    // Initialize hasHydrated based on whether we're on the client
    // This ensures server always has false, client starts with false
    const [hasHydrated, setHasHydrated] = useState(() => {
        // Only set to true if we're definitely on the client AND after initial mount
        // This ensures first render is always false (matching server)
        return false
    })

    // Mark hydration as complete after first client-side render
    // Use useEffect (not useLayoutEffect) to ensure it runs after hydration
    useEffect(() => {
        // This runs only on client, after hydration is complete
        setHasHydrated(true)
        setIsClient(true)
        setMounted(true)
    }, [])

    // Initialize language from storage or browser detection
    useEffect(() => {
        if (isInitialized || typeof window === 'undefined') {
            return
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEY) as Language | null
            const detected = stored && SUPPORTED_LANGUAGES.includes(stored)
                ? stored
                : detectBrowserLanguage()

            setLanguageState(detected)
            setIsInitialized(true)
        } catch (error) {
            console.warn('Failed to initialize language:', error)
            setIsInitialized(true)
        }
    }, [isInitialized])

    // Load English translations as fallback (only once)
    useEffect(() => {
        if (!isInitialized) {
            return
        }

        if (Object.keys(fallbackTranslations).length > 0) {
            return // Already loaded
        }

        let isMounted = true

        async function loadFallback() {
            try {
                const englishTranslations = await loadTranslations(DEFAULT_LANGUAGE)
                if (isMounted) {
                    setFallbackTranslations(englishTranslations)
                }
            } catch (error) {
                console.error('Failed to load fallback translations:', error)
            }
        }

        loadFallback()

        return () => {
            isMounted = false
        }
    }, [isInitialized, fallbackTranslations])

    // Load translations when language changes
    useEffect(() => {
        if (!isInitialized) {
            return
        }

        // If we have pending translations for this language, use them immediately
        if (pendingLanguage === language && pendingTranslations) {
            setTranslations(pendingTranslations)
            setPendingLanguage(null)
            setPendingTranslations(null)
            return
        }

        let isMounted = true

        async function load() {
            // Only show loading on initial load, not on language change
            if (Object.keys(translations).length === 0) {
                setLoading(true)
            }
            
            try {
                const loadedTranslations = await loadTranslations(language)
                if (isMounted) {
                    // Update translations immediately - don't clear old ones first
                    setTranslations(loadedTranslations)
                    // Clear any pending state
                    setPendingLanguage(null)
                    setPendingTranslations(null)
                }
            } catch (error) {
                console.error('Failed to load translations:', error)
                if (isMounted) {
                    // Don't clear translations on error - keep showing old ones
                    // Only clear if we have no translations at all
                    if (Object.keys(translations).length === 0) {
                        setTranslations({})
                    }
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        load()

        return () => {
            isMounted = false
        }
    }, [language, isInitialized, pendingLanguage, pendingTranslations])

    // Save language preference to localStorage
    // Preload translations before switching to prevent showing raw keys
    const setLanguage = useCallback(async (lang: Language) => {
        if (!SUPPORTED_LANGUAGES.includes(lang)) {
            console.warn(`Unsupported language: ${lang}. Falling back to ${DEFAULT_LANGUAGE}`)
            lang = DEFAULT_LANGUAGE
        }

        // If switching to the same language, do nothing
        if (lang === language) {
            return
        }

        try {
            localStorage.setItem(STORAGE_KEY, lang)
            
            // Preload translations before switching language
            // This prevents showing raw keys during the switch
            try {
                const newTranslations = await loadTranslations(lang)
                // Store pending translations
                setPendingTranslations(newTranslations)
                setPendingLanguage(lang)
                // Now switch the language - translations are already loaded
                setLanguageState(lang)
            } catch (error) {
                console.error('Failed to preload translations:', error)
                // Still switch language, but translations will load in useEffect
                setLanguageState(lang)
            }
        } catch (error) {
            console.warn('Failed to save language preference:', error)
            setLanguageState(lang)
        }
    }, [language])

    // Translation function with dot notation support and template variables
    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        if (!key) {
            return ''
        }

        // During SSR (server-side), always return key
        if (typeof window === 'undefined') {
            return key
        }

        // Check if we have translations available
        const hasTranslations = Object.keys(translations).length > 0 || Object.keys(fallbackTranslations).length > 0

        // Only return key if we truly have no translations AND we're still loading initially
        // During language switch, we keep old translations visible, so we should never show raw keys
        if (!hasTranslations && loading) {
            return key
        }

        // If we have no translations but not loading, try fallback
        if (!hasTranslations) {
            // Try fallback before returning key
            if (Object.keys(fallbackTranslations).length > 0) {
                let fallbackTranslation = getNestedValue(fallbackTranslations, key)
                if (!fallbackTranslation && fallbackTranslations[key]) {
                    fallbackTranslation = typeof fallbackTranslations[key] === 'string' ? fallbackTranslations[key] : undefined
                }
                if (fallbackTranslation) {
                    return params ? replaceTemplate(fallbackTranslation, params) : fallbackTranslation
                }
            }
            return key
        }

        // Try to get translation using dot notation from current language
        let translation = getNestedValue(translations, key)

        // If not found, try direct key access
        if (!translation && translations[key]) {
            translation = typeof translations[key] === 'string' ? translations[key] : undefined
        }

        // If still not found and not English, try fallback to English
        if (!translation && language !== DEFAULT_LANGUAGE && Object.keys(fallbackTranslations).length > 0) {
            translation = getNestedValue(fallbackTranslations, key)

            if (!translation && fallbackTranslations[key]) {
                translation = typeof fallbackTranslations[key] === 'string' ? fallbackTranslations[key] : undefined
            }
        }

        // If still not found, return the key itself (with warning in development)
        if (!translation) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`Translation missing for key: ${key} in language: ${language}`)
            }
            return key
        }

        // Replace template variables if params provided
        if (params) {
            return replaceTemplate(translation, params)
        }

        return translation
    }, [translations, fallbackTranslations, language, loading])

    const value = {
        language,
        setLanguage,
        t,
        loading,
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

