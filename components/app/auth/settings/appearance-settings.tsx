"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useTranslation } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Palette, Globe } from "lucide-react"
import { toast } from "sonner"

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const { t, language, setLanguage } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [primaryColor, setPrimaryColor] = useState<string>('default')

  // Helper function to get theme label
  const getThemeLabel = (themeValue: string | undefined) => {
    if (!themeValue || themeValue === 'system') return t('system')
    if (themeValue === 'light') return t('light')
    if (themeValue === 'dark') return t('dark')
    return t('system')
  }

  // Color options with their CSS variable values and translations
  const colorOptions = [
    { name: 'default', label: t('settings_page.appearance.colors.default'), value: 'oklch(0.205 0 0)', darkValue: 'oklch(0.922 0 0)' },
    { name: 'blue', label: t('settings_page.appearance.colors.blue'), value: 'oklch(0.5 0.2 250)', darkValue: 'oklch(0.7 0.2 250)' },
    { name: 'green', label: t('settings_page.appearance.colors.green'), value: 'oklch(0.5 0.2 150)', darkValue: 'oklch(0.7 0.2 150)' },
    { name: 'purple', label: t('settings_page.appearance.colors.purple'), value: 'oklch(0.5 0.2 300)', darkValue: 'oklch(0.7 0.2 300)' },
    { name: 'red', label: t('settings_page.appearance.colors.red'), value: 'oklch(0.5 0.2 25)', darkValue: 'oklch(0.7 0.2 25)' },
    { name: 'orange', label: t('settings_page.appearance.colors.orange'), value: 'oklch(0.6 0.2 70)', darkValue: 'oklch(0.75 0.2 70)' },
    { name: 'pink', label: t('settings_page.appearance.colors.pink'), value: 'oklch(0.6 0.2 350)', darkValue: 'oklch(0.75 0.2 350)' },
    { name: 'cyan', label: t('settings_page.appearance.colors.cyan'), value: 'oklch(0.6 0.2 200)', darkValue: 'oklch(0.75 0.2 200)' },
    { name: 'amber', label: t('settings_page.appearance.colors.amber'), value: 'oklch(0.65 0.2 85)', darkValue: 'oklch(0.8 0.2 85)' },
  ]

  // Prevent hydration mismatch by only rendering Select after mount
  useEffect(() => {
    setMounted(true)

    // Load saved primary color from localStorage
    const savedColor = localStorage.getItem('primary-color') || 'default'
    setPrimaryColor(savedColor)
    applyPrimaryColor(savedColor)
  }, [])

  // Apply primary color to CSS variables
  const applyPrimaryColor = (colorName: string) => {
    if (colorName === 'default') {
      // Reset to default
      document.documentElement.style.setProperty('--primary', '')
      document.documentElement.style.setProperty('--primary-foreground', '')
      return
    }

    const color = colorOptions.find(c => c.name === colorName)
    if (color) {
      const isDark = document.documentElement.classList.contains('dark')
      const primaryValue = isDark ? color.darkValue : color.value

      // Calculate appropriate foreground color (white or black based on lightness)
      const lightness = parseFloat(primaryValue.match(/oklch\(([\d.]+)/)?.[1] || '0.5')
      const foregroundValue = lightness > 0.6 ? 'oklch(0.145 0 0)' : 'oklch(0.985 0 0)'

      document.documentElement.style.setProperty('--primary', primaryValue)
      document.documentElement.style.setProperty('--primary-foreground', foregroundValue)
    }
  }

  // Handle primary color change
  const handlePrimaryColorChange = (colorName: string) => {
    setPrimaryColor(colorName)
    localStorage.setItem('primary-color', colorName)
    applyPrimaryColor(colorName)
    toast.success(t('settings_page.appearance.primary_color_updated'))
  }

  // Update color when theme changes
  useEffect(() => {
    if (mounted && primaryColor) {
      applyPrimaryColor(primaryColor)
    }
  }, [theme, mounted, primaryColor])

  // Handle language change
  const handleLanguageChange = async (lang: 'en' | 'ms') => {
    setLanguage(lang)
    toast.success(t('settings_page.appearance.language_updated'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
          <Palette className="h-5 w-5" />
          {t('settings_page.appearance.title')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('settings_page.appearance.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <Label suppressHydrationWarning>{t('settings_page.appearance.theme')}</Label>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('settings_page.appearance.theme_description')}
            </p>
          </div>
          <Select value={mounted ? (theme || 'system') : 'system'} onValueChange={setTheme}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder={getThemeLabel(theme)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light" suppressHydrationWarning>{t('light')}</SelectItem>
              <SelectItem value="dark" suppressHydrationWarning>{t('dark')}</SelectItem>
              <SelectItem value="system" suppressHydrationWarning>{t('system')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <Label suppressHydrationWarning>{t('language')}</Label>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('settings_page.appearance.language_description')}
            </p>
          </div>
          <Select value={mounted ? language : 'en'} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full sm:w-40">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en" suppressHydrationWarning>
                {t('settings_page.appearance.languages.en')}
              </SelectItem>
              <SelectItem value="ms" suppressHydrationWarning>
                {t('settings_page.appearance.languages.ms')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <Label suppressHydrationWarning>{t('settings_page.appearance.primary_color')}</Label>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('settings_page.appearance.primary_color_description')}
            </p>
          </div>
          <Select
            value={mounted ? (primaryColor || 'default') : 'default'}
            onValueChange={handlePrimaryColorChange}
          >
            <SelectTrigger className="w-full sm:w-48">
              <div className="flex items-center gap-2">
                {mounted && (() => {
                  const selectedColor = colorOptions.find(c => c.name === primaryColor)
                  if (!selectedColor) return null

                  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                  const colorValue = isDark ? selectedColor.darkValue : selectedColor.value

                  return (
                    <div
                      className="h-4 w-4 rounded border border-border/50 shrink-0"
                      style={{ backgroundColor: colorValue }}
                    />
                  )
                })()}
                <SelectValue placeholder={t('settings_page.appearance.primary_color_placeholder')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              {mounted && colorOptions.map((color) => {
                const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                const colorValue = isDark ? color.darkValue : color.value

                return (
                  <SelectItem key={color.name} value={color.name}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded border border-border/50 shrink-0"
                        style={{ backgroundColor: colorValue }}
                      />
                      <span suppressHydrationWarning>{color.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

