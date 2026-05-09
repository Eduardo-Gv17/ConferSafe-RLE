import { useState, useEffect } from 'react'

export function useTheme() {
  const [navy, setNavy] = useState(() =>
    localStorage.getItem('confersafe_theme') === 'navy'
  )

  useEffect(() => {
    document.documentElement.dataset.theme = navy ? 'navy' : 'light'
    localStorage.setItem('confersafe_theme', navy ? 'navy' : 'light')
  }, [navy])

  // Apply on first render
  useEffect(() => {
    document.documentElement.dataset.theme = navy ? 'navy' : 'light'
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { dark: navy, toggle: () => setNavy(n => !n) }
}
