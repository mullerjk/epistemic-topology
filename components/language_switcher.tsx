import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (locale: string) => {
    router.push(router.asPath, router.asPath, { locale });
    setIsOpen(false);
  };

  return (
    <div className="language-switcher">
      <button 
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
      >
        <span className="language-flag">{currentLanguage.flag}</span>
        <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .language-switcher {
          position: relative;
          display: inline-block;
          z-index: 1000;
        }

        .language-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .language-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .language-flag {
          font-size: 1.25rem;
        }

        .language-code {
          font-weight: 600;
          text-transform: uppercase;
        }

        .arrow {
          font-size: 0.625rem;
          transition: transform 0.3s ease;
        }

        .arrow.open {
          transform: rotate(180deg);
        }

        .language-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: rgba(15, 15, 20, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 8px;
          overflow: hidden;
          min-width: 180px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .language-option:hover {
          background: rgba(102, 126, 234, 0.2);
        }

        .language-option.active {
          background: rgba(102, 126, 234, 0.3);
          font-weight: 600;
        }

        .language-option:first-child {
          border-radius: 8px 8px 0 0;
        }

        .language-option:last-child {
          border-radius: 0 0 8px 8px;
        }

        .language-name {
          flex: 1;
          text-align: left;
        }
      `}</style>
    </div>
  );
}
