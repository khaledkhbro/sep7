"use client"

import { useState, useEffect } from "react"
import { getTranslation, getCurrentLanguage, type TranslationKey, type Language } from "@/lib/translations"

export function useTranslation() {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "language" && e.newValue) {
        setLanguage(e.newValue as Language)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const t = (key: TranslationKey): string => {
    return getTranslation(key, language)
  }

  return { t, language }
}
