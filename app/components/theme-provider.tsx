"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

const ThemeProviderContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({
  theme: "dark",
  setTheme: () => null,
})

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "dark",
  enableSystem = false,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement

    if (disableTransitionOnChange) {
      const original = root.style.transition
      root.style.transition = ""
      requestAnimationFrame(() => {
        root.style.transition = original
      })
    }

    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme, disableTransitionOnChange])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme)
      try {
        localStorage.setItem("theme", theme)
      } catch (error) {
        // Ignore localStorage errors
      }
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}