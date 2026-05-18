import { useCallback, useState } from 'react'

export function useTheme(defaultThemeId = 'github') {
  const [themeId, setThemeId] = useState(defaultThemeId)

  const themeClass = `theme-${themeId}`

  const switchTheme = useCallback((id: string) => {
    setThemeId(id)
  }, [])

  return { themeId, themeClass, switchTheme }
}
