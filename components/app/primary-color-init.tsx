"use client"

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

// Color options matching settings page
const colorOptions = [
  { name: 'default', label: 'Default', value: 'oklch(0.205 0 0)', darkValue: 'oklch(0.922 0 0)' },
  { name: 'blue', label: 'Blue', value: 'oklch(0.5 0.2 250)', darkValue: 'oklch(0.7 0.2 250)' },
  { name: 'green', label: 'Green', value: 'oklch(0.5 0.2 150)', darkValue: 'oklch(0.7 0.2 150)' },
  { name: 'purple', label: 'Purple', value: 'oklch(0.5 0.2 300)', darkValue: 'oklch(0.7 0.2 300)' },
  { name: 'red', label: 'Red', value: 'oklch(0.5 0.2 25)', darkValue: 'oklch(0.7 0.2 25)' },
  { name: 'orange', label: 'Orange', value: 'oklch(0.6 0.2 70)', darkValue: 'oklch(0.75 0.2 70)' },
  { name: 'pink', label: 'Pink', value: 'oklch(0.6 0.2 350)', darkValue: 'oklch(0.75 0.2 350)' },
  { name: 'cyan', label: 'Cyan', value: 'oklch(0.6 0.2 200)', darkValue: 'oklch(0.75 0.2 200)' },
  { name: 'amber', label: 'Amber', value: 'oklch(0.65 0.2 85)', darkValue: 'oklch(0.8 0.2 85)' },
]

// Apply primary color to CSS variables
function applyPrimaryColor(colorName: string, isDark: boolean) {
  if (colorName === 'default') {
    // Reset to default
    document.documentElement.style.setProperty('--primary', '')
    document.documentElement.style.setProperty('--primary-foreground', '')
    return
  }

  const color = colorOptions.find(c => c.name === colorName)
  if (color) {
    const primaryValue = isDark ? color.darkValue : color.value

    // Calculate appropriate foreground color (white or black based on lightness)
    const lightness = parseFloat(primaryValue.match(/oklch\(([\d.]+)/)?.[1] || '0.5')
    const foregroundValue = lightness > 0.6 ? 'oklch(0.145 0 0)' : 'oklch(0.985 0 0)'

    document.documentElement.style.setProperty('--primary', primaryValue)
    document.documentElement.style.setProperty('--primary-foreground', foregroundValue)
  }
}

/**
 * Client component to initialize primary color from localStorage on app load
 * This ensures the user's selected primary color is applied immediately
 */
export function PrimaryColorInit() {
  const { theme, systemTheme } = useTheme()

  useEffect(() => {
    // Get saved primary color from localStorage
    const savedColor = localStorage.getItem('primary-color')
    if (!savedColor) return

    // Determine if dark mode is active
    const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')

    // Apply the color immediately
    applyPrimaryColor(savedColor, isDark)
  }, [theme, systemTheme])

  // Also listen for theme changes to update color
  useEffect(() => {
    const savedColor = localStorage.getItem('primary-color')
    if (!savedColor) return

    const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
    applyPrimaryColor(savedColor, isDark)
  }, [theme, systemTheme])

  return null
}

