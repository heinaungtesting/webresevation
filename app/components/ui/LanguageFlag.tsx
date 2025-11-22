import { cn } from '@/lib/utils';

interface LanguageFlagProps {
  code: string; // ISO 639-1 language code (e.g., 'en', 'ja', 'ko')
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showEnglishFriendly?: boolean;
  className?: string;
}

// Language configuration with flags and names
const LANGUAGE_CONFIG: Record<string, {
  flag: string;
  name: string;
  nativeName: string;
}> = {
  ja: { flag: '\uD83C\uDDEF\uD83C\uDDF5', name: 'Japanese', nativeName: '\u65E5\u672C\u8A9E' },
  en: { flag: '\uD83C\uDDEC\uD83C\uDDE7', name: 'English', nativeName: 'English' },
  ko: { flag: '\uD83C\uDDF0\uD83C\uDDF7', name: 'Korean', nativeName: '\uD55C\uAD6D\uC5B4' },
  zh: { flag: '\uD83C\uDDE8\uD83C\uDDF3', name: 'Chinese', nativeName: '\u4E2D\u6587' },
  es: { flag: '\uD83C\uDDEA\uD83C\uDDF8', name: 'Spanish', nativeName: 'Espa\u00F1ol' },
  fr: { flag: '\uD83C\uDDEB\uD83C\uDDF7', name: 'French', nativeName: 'Fran\u00E7ais' },
  de: { flag: '\uD83C\uDDE9\uD83C\uDDEA', name: 'German', nativeName: 'Deutsch' },
  pt: { flag: '\uD83C\uDDE7\uD83C\uDDF7', name: 'Portuguese', nativeName: 'Portugu\u00EAs' },
  it: { flag: '\uD83C\uDDEE\uD83C\uDDF9', name: 'Italian', nativeName: 'Italiano' },
  ru: { flag: '\uD83C\uDDF7\uD83C\uDDFA', name: 'Russian', nativeName: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439' },
  vi: { flag: '\uD83C\uDDFB\uD83C\uDDF3', name: 'Vietnamese', nativeName: 'Ti\u1EBFng Vi\u1EC7t' },
  th: { flag: '\uD83C\uDDF9\uD83C\uDDED', name: 'Thai', nativeName: '\u0E44\u0E17\u0E22' },
  id: { flag: '\uD83C\uDDEE\uD83C\uDDE9', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  ar: { flag: '\uD83C\uDDF8\uD83C\uDDE6', name: 'Arabic', nativeName: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
  hi: { flag: '\uD83C\uDDEE\uD83C\uDDF3', name: 'Hindi', nativeName: '\u0939\u093F\u0928\u094D\u0926\u0940' },
  nl: { flag: '\uD83C\uDDF3\uD83C\uDDF1', name: 'Dutch', nativeName: 'Nederlands' },
  pl: { flag: '\uD83C\uDDF5\uD83C\uDDF1', name: 'Polish', nativeName: 'Polski' },
  tr: { flag: '\uD83C\uDDF9\uD83C\uDDF7', name: 'Turkish', nativeName: 'T\u00FCrk\u00E7e' },
};

// Default for unknown languages
const DEFAULT_LANGUAGE = { flag: '\uD83C\uDFF3\uFE0F', name: 'Unknown', nativeName: 'Unknown' };

const SIZES = {
  sm: {
    flag: 'text-base',
    label: 'text-xs',
    container: 'gap-1',
  },
  md: {
    flag: 'text-lg',
    label: 'text-sm',
    container: 'gap-1.5',
  },
  lg: {
    flag: 'text-2xl',
    label: 'text-base',
    container: 'gap-2',
  },
};

export default function LanguageFlag({
  code,
  size = 'md',
  showLabel = false,
  showEnglishFriendly = false,
  className,
}: LanguageFlagProps) {
  const config = LANGUAGE_CONFIG[code.toLowerCase()] || DEFAULT_LANGUAGE;
  const sizeConfig = SIZES[size];

  return (
    <span
      className={cn(
        'inline-flex items-center',
        sizeConfig.container,
        className
      )}
      title={config.name}
    >
      <span className={sizeConfig.flag}>{config.flag}</span>
      {showLabel && (
        <span className={cn('text-slate-600', sizeConfig.label)}>
          {config.name}
        </span>
      )}
      {showEnglishFriendly && code.toLowerCase() !== 'en' && (
        <span
          className={cn(
            'inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full',
            sizeConfig.label
          )}
          title="English Friendly"
        >
          <span className="text-xs mr-0.5">\uD83C\uDDEC\uD83C\uDDE7</span>
          OK
        </span>
      )}
    </span>
  );
}

// Export helper function for language options
export function getLanguageOptions(): Array<{ value: string; label: string; flag: string }> {
  return Object.entries(LANGUAGE_CONFIG).map(([code, config]) => ({
    value: code,
    label: config.name,
    flag: config.flag,
  }));
}

// Export helper to get language name
export function getLanguageName(code: string): string {
  return LANGUAGE_CONFIG[code.toLowerCase()]?.name || code.toUpperCase();
}

// Export helper to get language flag
export function getLanguageFlag(code: string): string {
  return LANGUAGE_CONFIG[code.toLowerCase()]?.flag || DEFAULT_LANGUAGE.flag;
}
