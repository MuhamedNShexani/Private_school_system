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
      { code: "ku", name: "کوردی", flag: "🇭🇺", dir: "rtl" },
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
  const t = (key, fallback = key, variables = {}) => {
    if (loading) return fallback;

    let translation = translations[key];
    if (translation) {
      // Replace variables in translation
      return replaceVariables(translation, variables);
    }

    // If translation not found, return fallback
    console.warn(`Translation missing for key: ${key}`);
    return replaceVariables(fallback, variables);
  };

  // Helper function to replace variables in translation strings
  const replaceVariables = (text, variables = {}) => {
    let result = text;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key]);
    });
    return result;
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

        console.log(`🌐 Fetching translations for language: ${currentLanguage}`);
        const response = await translationsAPI.getAll({ language: currentLanguage });
        
        console.log(`📡 API Response:`, response.data);

        let translationsData = {};
        
        // Handle the response format - API returns { success: true, data: { key: value, ... } }
        if (response.data && response.data.data) {
          console.log(`📊 Response data type: ${typeof response.data.data}, is array: ${Array.isArray(response.data.data)}`);
          
          if (typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
            // Data is already a key-value object (when language is specified in API)
            translationsData = response.data.data;
            console.log(`✅ Using object format: ${Object.keys(translationsData).length} keys`);
          } else if (Array.isArray(response.data.data)) {
            // Data is an array of translation objects
            console.log(`📋 Using array format: ${response.data.data.length} items`);
            response.data.data.forEach((item) => {
              if (item.key && item.translations) {
                translationsData[item.key] = 
                  item.translations[currentLanguage] || 
                  item.translations.en || 
                  item.key;
              }
            });
          }
        } else {
          console.error(`❌ No response.data.data found!`, response.data);
        }

        setTranslations(translationsData);
        console.log(`✅ Loaded ${Object.keys(translationsData).length} translations for ${currentLanguage}`);
        console.log(`🔍 Sample keys:`, Object.keys(translationsData).slice(0, 10));
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
