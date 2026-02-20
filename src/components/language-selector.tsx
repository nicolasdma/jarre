'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Language = 'es' | 'en';

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

export function LanguageSelector({ currentLanguage }: { currentLanguage: Language }) {
  const [language, setLanguage] = useState<Language>(currentLanguage);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = async (newLanguage: Language) => {
    if (newLanguage === language) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLanguage }),
      });

      if (!response.ok) {
        throw new Error('Failed to update language');
      }

      setLanguage(newLanguage);
      router.refresh();
    } catch (error) {
      console.error('Error updating language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-j-text-secondary">Language:</span>
      <div className="flex gap-1">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => handleChange(lang.value)}
            disabled={isLoading}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[44px] ${
              language === lang.value
                ? 'bg-j-accent text-j-text-on-accent'
                : 'bg-j-bg-alt text-j-text-secondary hover:bg-j-bg-hover border border-j-border'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
