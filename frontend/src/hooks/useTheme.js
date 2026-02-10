import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {}
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
  }, [theme]);

  return { theme, setTheme };
}