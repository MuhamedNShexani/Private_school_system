import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { translationsAPI } from "../services/api";

const TranslationContext = createContext();

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "en"
  );
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available languages
  const languages = useMemo(
    () => [
      { code: "en", name: "English", flag: "🇺🇸", dir: "ltr" },
      { code: "ar", name: "العربية", flag: "🇸🇦", dir: "rtl" },
      { code: "ku", name: "کوردی", flag: "🇮🇶", dir: "rtl" },
    ],
    []
  );

  // Load translations for current language
  const loadTranslations = useCallback(
    async (language = currentLanguage) => {
      try {
        setLoading(true);
        setError(null);

        const response = await translationsAPI.getAll({ language });

        if (response.data.success) {
          setTranslations(response.data.data);
        } else {
          throw new Error("Failed to load translations");
        }
      } catch (err) {
        console.error("Error loading translations:", err);
        setError("Failed to load translations");
        // Fallback to empty translations
        setTranslations({});
      } finally {
        setLoading(false);
      }
    },
    [currentLanguage]
  );

  // Change language
  const changeLanguage = async (languageCode) => {
    if (languageCode === currentLanguage) return;

    setCurrentLanguage(languageCode);
    localStorage.setItem("language", languageCode);

    // Update document direction
    const language = languages.find((lang) => lang.code === languageCode);
    if (language) {
      document.documentElement.dir = language.dir;
      document.documentElement.lang = languageCode;
    }

    await loadTranslations(languageCode);
  };

  // Get translation function
  const t = (key, fallback = key) => {
    if (loading) return fallback;

    const translation = translations[key];
    if (translation) {
      return translation;
    }

    // If translation not found, return fallback
    console.warn(`Translation missing for key: ${key}`);
    return fallback;
  };

  // Get current language info
  const getCurrentLanguageInfo = useCallback(() => {
    return (
      languages.find((lang) => lang.code === currentLanguage) || languages[0]
    );
  }, [languages, currentLanguage]);

  // Initialize
  useEffect(() => {
    const initializeTranslations = async () => {
      // Set initial document direction and language
      const languageInfo = getCurrentLanguageInfo();
      document.documentElement.dir = languageInfo.dir;
      document.documentElement.lang = currentLanguage;

      await loadTranslations();
    };

    initializeTranslations();
  }, [currentLanguage, getCurrentLanguageInfo, loadTranslations]);

  const value = {
    currentLanguage,
    languages,
    translations,
    loading,
    error,
    t,
    changeLanguage,
    loadTranslations,
    getCurrentLanguageInfo,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};
