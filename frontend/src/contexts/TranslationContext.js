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
      const languageInfo = languages.find(
        (lang) => lang.code === currentLanguage
      ) || languages[0];
      document.documentElement.dir = languageInfo.dir;
      document.documentElement.lang = currentLanguage;

      try {
        setLoading(true);
        setError(null);

        const response = await translationsAPI.getAll({ language: currentLanguage });

        let translationsData = {};
        
        // Handle the response format - API returns { success: true, data: { key: value, ... } }
        if (response.data && response.data.data) {
          if (typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
            // Data is already a key-value object (when language is specified in API)
            translationsData = response.data.data;
          } else if (Array.isArray(response.data.data)) {
            // Data is an array of translation objects
            response.data.data.forEach((item) => {
              if (item.key && item.translations) {
                translationsData[item.key] = 
                  item.translations[currentLanguage] || 
                  item.translations.en || 
                  item.key;
              }
            });
          }
        }

        setTranslations(translationsData);
        console.log(`Loaded ${Object.keys(translationsData).length} translations for ${currentLanguage}`);
      } catch (err) {
        console.error("Error loading translations:", err);
        setError("Failed to load translations");
        // Fallback to empty translations
        setTranslations({});
      } finally {
        setLoading(false);
      }
    };

    initializeTranslations();
  }, [currentLanguage, languages]);

  const value = {
    currentLanguage,
    languages,
    translations,
    loading,
    error,
    t,
    changeLanguage,
    getCurrentLanguageInfo,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};
