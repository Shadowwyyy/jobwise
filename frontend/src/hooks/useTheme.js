import { useEffect, useState } from "react"

export function useTheme() {
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark") {
      setTheme(saved)
      return
    }

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches

    setTheme(prefersDark ? "dark" : "light")
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") root.classList.add("dark")
    else root.classList.remove("dark")

    localStorage.setItem("theme", theme)
  }, [theme])

  return { theme, setTheme }
}