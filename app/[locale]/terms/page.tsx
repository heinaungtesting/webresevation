import LegalPageLayout, {
  LegalSection,
  DisclaimerBanner,
} from '@/app/components/layout/LegalPageLayout';

// Content stored directly in component to avoid bloating i18n bundle
const TERMS_CONTENT = {
  en: {
    title: 'Terms of Service',
    lastUpdated: 'November 2024',
    backLabel: 'Back',
    sections: {
      acceptance: {
        title: '1. Acceptance of Terms',
        content: [
          'By accessing or using SportsMatch Tokyo ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.',
          'We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.',
        ],
      },
      cancellation: {
        title: '2. Cancellation Policy (The Golden Rule)',
        content: [
          'We believe in fair play both on and off the court. Our cancellation policy exists to respect everyone\'s time:',
        ],
        rules: [
          'Cancellations made 24+ hours before a session: No penalty',
          'Cancellations made less than 24 hours before: Marked as a "Late Cancel" on your profile',
          'No-shows (not canceling at all): Marked as "No-Show" and impacts your reliability score',
          '3 No-Shows within 30 days: Account suspension for review',
        ],
        note: 'Your reliability score is visible to hosts and may affect your ability to join popular sessions.',
      },
      conduct: {
        title: '3. User Conduct & Safety',
        content: [
          'SportsMatch Tokyo is a sports community platform. We take safety seriously:',
        ],
        prohibited: [
          'Harassment, bullying, or intimidation of any kind',
          'Using the platform for dating, solicitation, or non-sports purposes',
          'Discriminatory behavior based on race, gender, nationality, or ability',
          'Sharing inappropriate content or spam',
          'Creating fake profiles or misrepresenting yourself',
        ],
        warning: 'Violations result in immediate account suspension without warning. We have zero tolerance for harassment.',
      },
      hosts: {
        title: '4. Host Responsibilities',
        content: [
          'If you host a session, you agree to:',
        ],
        responsibilities: [
          'Provide accurate information about the venue, time, and skill level',
          'Only charge actual court/facility costs (no profit-making)',
          'Be transparent about any fees before participants join',
          'Show up on time and manage the session responsibly',
          'Mark attendance accurately after each session',
        ],
        note: 'Hosts who repeatedly overcharge or provide misleading information will be removed from the platform.',
      },
      liability: {
        title: '5. Liability Disclaimer',
        content: [
          'SportsMatch Tokyo is a booking and matching platform only. We do not:',
        ],
        disclaimers: [
          'Own, operate, or manage any sports facilities',
          'Provide sports instruction or supervision',
          'Guarantee the safety of any session or venue',
          'Take responsibility for injuries, accidents, or disputes during sessions',
        ],
        important: 'By participating in any session, you acknowledge that sports activities carry inherent risks. You participate at your own risk and are responsible for your own safety and insurance.',
      },
      accounts: {
        title: '6. Account Termination',
        content: [
          'We may suspend or terminate your account if you:',
        ],
        reasons: [
          'Violate these Terms of Service',
          'Engage in fraudulent or illegal activity',
          'Receive multiple complaints from other users',
          'Abuse the platform or other users',
        ],
        note: 'You may delete your account at any time from the Settings page.',
      },
      changes: {
        title: '7. Changes to Service',
        content: [
          'We reserve the right to modify, suspend, or discontinue the Service at any time without notice. We are not liable for any modification, suspension, or discontinuation of the Service.',
        ],
      },
      contact: {
        title: '8. Contact Us',
        content: [
          'If you have questions about these Terms, please contact us through the app\'s feedback feature or at support@sportsmatch.tokyo',
        ],
      },
    },
  },
  ja: {
    title: '\u5229\u7528\u898F\u7D04',
    lastUpdated: '2024\u5E7411\u6708',
    backLabel: '\u623B\u308B',
    sections: {
      acceptance: {
        title: '1. \u898F\u7D04\u3078\u306E\u540C\u610F',
        content: [
          'SportsMatch Tokyo\uFF08\u4EE5\u4E0B\u300C\u672C\u30B5\u30FC\u30D3\u30B9\u300D\uFF09\u3092\u5229\u7528\u3059\u308B\u3053\u3068\u3067\u3001\u672C\u5229\u7528\u898F\u7D04\u306B\u540C\u610F\u3057\u305F\u3082\u306E\u3068\u307F\u306A\u3055\u308C\u307E\u3059\u3002\u540C\u610F\u3044\u305F\u3060\u3051\u306A\u3044\u5834\u5408\u306F\u3001\u672C\u30B5\u30FC\u30D3\u30B9\u306E\u5229\u7528\u3092\u304A\u63A7\u3048\u304F\u3060\u3055\u3044\u3002',
          '\u5F53\u793E\u306F\u3001\u3044\u3064\u3067\u3082\u672C\u898F\u7D04\u3092\u5909\u66F4\u3059\u308B\u6A29\u5229\u3092\u6709\u3057\u307E\u3059\u3002\u5909\u66F4\u5F8C\u3082\u672C\u30B5\u30FC\u30D3\u30B9\u3092\u7D99\u7D9A\u3057\u3066\u5229\u7528\u3059\u308B\u3053\u3068\u3067\u3001\u65B0\u3057\u3044\u898F\u7D04\u306B\u540C\u610F\u3057\u305F\u3082\u306E\u3068\u307F\u306A\u3055\u308C\u307E\u3059\u3002',
        ],
      },
      cancellation: {
        title: '2. \u30AD\u30E3\u30F3\u30BB\u30EB\u30DD\u30EA\u30B7\u30FC\uFF08\u30B4\u30FC\u30EB\u30C7\u30F3\u30EB\u30FC\u30EB\uFF09',
        content: [
          '\u7686\u3055\u307E\u306E\u6642\u9593\u3092\u5C0A\u91CD\u3059\u308B\u305F\u3081\u3001\u4EE5\u4E0B\u306E\u30AD\u30E3\u30F3\u30BB\u30EB\u30DD\u30EA\u30B7\u30FC\u3092\u8A2D\u3051\u3066\u3044\u307E\u3059\uFF1A',
        ],
        rules: [
          '\u30BB\u30C3\u30B7\u30E7\u30F3\u958B\u59CB24\u6642\u9593\u4EE5\u524D\u306E\u30AD\u30E3\u30F3\u30BB\u30EB\uFF1A\u30DA\u30CA\u30EB\u30C6\u30A3\u306A\u3057',
          '\u30BB\u30C3\u30B7\u30E7\u30F3\u958B\u59CB24\u6642\u9593\u4EE5\u5185\u306E\u30AD\u30E3\u30F3\u30BB\u30EB\uFF1A\u300C\u9045\u523B\u30AD\u30E3\u30F3\u30BB\u30EB\u300D\u3068\u3057\u3066\u8A18\u9332',
          '\u7121\u65AD\u6B20\u5E2D\uFF08\u30AD\u30E3\u30F3\u30BB\u30EB\u306A\u3057\uFF09\uFF1A\u300C\u30CE\u30FC\u30B7\u30E7\u30FC\u300D\u3068\u3057\u3066\u8A18\u9332\u3001\u4FE1\u983C\u5EA6\u30B9\u30B3\u30A2\u306B\u5F71\u97FF',
          '30\u65E5\u4EE5\u5185\u306B3\u56DE\u306E\u30CE\u30FC\u30B7\u30E7\u30FC\uFF1A\u30A2\u30AB\u30A6\u30F3\u30C8\u505C\u6B62\u5BE9\u67FB',
        ],
        note: '\u4FE1\u983C\u5EA6\u30B9\u30B3\u30A2\u306F\u30DB\u30B9\u30C8\u306B\u8868\u793A\u3055\u308C\u3001\u4EBA\u6C17\u30BB\u30C3\u30B7\u30E7\u30F3\u3078\u306E\u53C2\u52A0\u306B\u5F71\u97FF\u3059\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002',
      },
      conduct: {
        title: '3. \u30E6\u30FC\u30B6\u30FC\u306E\u884C\u52D5\u898F\u7BC4\u3068\u5B89\u5168',
        content: [
          'SportsMatch Tokyo\u306F\u30B9\u30DD\u30FC\u30C4\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3067\u3059\u3002\u5B89\u5168\u3092\u91CD\u8996\u3057\u3066\u3044\u307E\u3059\uFF1A',
        ],
        prohibited: [
          '\u3042\u3089\u3086\u308B\u5F62\u614B\u306E\u30CF\u30E9\u30B9\u30E1\u30F3\u30C8\u3001\u3044\u3058\u3081\u3001\u8105\u8FEB\u884C\u70BA',
          '\u51FA\u4F1A\u3044\u7CFB\u3001\u52E7\u8A98\u3001\u30B9\u30DD\u30FC\u30C4\u4EE5\u5916\u306E\u76EE\u7684\u3067\u306E\u5229\u7528',
          '\u4EBA\u7A2E\u3001\u6027\u5225\u3001\u56FD\u7C4D\u3001\u80FD\u529B\u306B\u57FA\u3065\u304F\u5DEE\u5225\u7684\u884C\u70BA',
          '\u4E0D\u9069\u5207\u306A\u30B3\u30F3\u30C6\u30F3\u30C4\u3084\u30B9\u30D1\u30E0\u306E\u5171\u6709',
          '\u507D\u306E\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u4F5C\u6210\u3084\u306A\u308A\u3059\u307E\u3057',
        ],
        warning: '\u9055\u53CD\u8005\u306F\u8B66\u544A\u306A\u3057\u306B\u5373\u6642\u30A2\u30AB\u30A6\u30F3\u30C8\u505C\u6B62\u3068\u306A\u308A\u307E\u3059\u3002\u30CF\u30E9\u30B9\u30E1\u30F3\u30C8\u306B\u5BFE\u3057\u3066\u306F\u30BC\u30ED\u30C8\u30EC\u30E9\u30F3\u30B9\u3067\u3059\u3002',
      },
      hosts: {
        title: '4. \u30DB\u30B9\u30C8\u306E\u8CAC\u4EFB',
        content: [
          '\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4E3B\u50AC\u3059\u308B\u5834\u5408\u3001\u4EE5\u4E0B\u306B\u540C\u610F\u3057\u305F\u3082\u306E\u3068\u3057\u307E\u3059\uFF1A',
        ],
        responsibilities: [
          '\u4F1A\u5834\u3001\u6642\u9593\u3001\u30B9\u30AD\u30EB\u30EC\u30D9\u30EB\u306B\u3064\u3044\u3066\u6B63\u78BA\u306A\u60C5\u5831\u3092\u63D0\u4F9B\u3059\u308B',
          '\u5B9F\u8CBB\uFF08\u30B3\u30FC\u30C8\u4EE3\u7B49\uFF09\u306E\u307F\u3092\u5F81\u53CE\u3059\u308B\uFF08\u55B6\u5229\u76EE\u7684\u7981\u6B62\uFF09',
          '\u53C2\u52A0\u524D\u306B\u8CBB\u7528\u306B\u3064\u3044\u3066\u900F\u660E\u6027\u3092\u4FDD\u3064',
          '\u6642\u9593\u901A\u308A\u306B\u51FA\u5E2D\u3057\u3001\u8CAC\u4EFB\u3092\u6301\u3063\u3066\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u904B\u55B6\u3059\u308B',
          '\u30BB\u30C3\u30B7\u30E7\u30F3\u5F8C\u306B\u51FA\u6B20\u3092\u6B63\u78BA\u306B\u8A18\u9332\u3059\u308B',
        ],
        note: '\u7E70\u308A\u8FD4\u3057\u904E\u5270\u8ACB\u6C42\u3084\u8AA4\u89E3\u3092\u62DB\u304F\u60C5\u5831\u3092\u63D0\u4F9B\u3057\u305F\u30DB\u30B9\u30C8\u306F\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u304B\u3089\u524A\u9664\u3055\u308C\u307E\u3059\u3002',
      },
      liability: {
        title: '5. \u514D\u8CAC\u4E8B\u9805',
        content: [
          'SportsMatch Tokyo\u306F\u4E88\u7D04\u30FB\u30DE\u30C3\u30C1\u30F3\u30B0\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306E\u307F\u3067\u3059\u3002\u4EE5\u4E0B\u306B\u3064\u3044\u3066\u306F\u8CAC\u4EFB\u3092\u8CA0\u3044\u307E\u305B\u3093\uFF1A',
        ],
        disclaimers: [
          '\u30B9\u30DD\u30FC\u30C4\u65BD\u8A2D\u306E\u6240\u6709\u3001\u904B\u55B6\u3001\u7BA1\u7406',
          '\u30B9\u30DD\u30FC\u30C4\u6307\u5C0E\u3084\u76E3\u7763\u306E\u63D0\u4F9B',
          '\u30BB\u30C3\u30B7\u30E7\u30F3\u3084\u4F1A\u5834\u306E\u5B89\u5168\u6027\u306E\u4FDD\u8A3C',
          '\u30BB\u30C3\u30B7\u30E7\u30F3\u4E2D\u306E\u6016\u6211\u3001\u4E8B\u6545\u3001\u30C8\u30E9\u30D6\u30EB',
        ],
        important: '\u30BB\u30C3\u30B7\u30E7\u30F3\u306B\u53C2\u52A0\u3059\u308B\u3053\u3068\u3067\u3001\u30B9\u30DD\u30FC\u30C4\u6D3B\u52D5\u306B\u306F\u56FA\u6709\u306E\u30EA\u30B9\u30AF\u304C\u3042\u308B\u3053\u3068\u3092\u8A8D\u8B58\u3057\u3066\u3044\u308B\u3082\u306E\u3068\u3057\u307E\u3059\u3002\u81EA\u5DF1\u8CAC\u4EFB\u3067\u53C2\u52A0\u3057\u3001\u5FC5\u8981\u306B\u5FDC\u3058\u3066\u4FDD\u967A\u306B\u52A0\u5165\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
      },
      accounts: {
        title: '6. \u30A2\u30AB\u30A6\u30F3\u30C8\u306E\u505C\u6B62',
        content: [
          '\u4EE5\u4E0B\u306E\u5834\u5408\u3001\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u505C\u6B62\u307E\u305F\u306F\u524A\u9664\u3059\u308B\u3053\u3068\u304C\u3042\u308A\u307E\u3059\uFF1A',
        ],
        reasons: [
          '\u672C\u5229\u7528\u898F\u7D04\u306E\u9055\u53CD',
          '\u8A50\u6B3A\u307E\u305F\u306F\u9055\u6CD5\u884C\u70BA',
          '\u4ED6\u306E\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u8907\u6570\u306E\u82E6\u60C5',
          '\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u307E\u305F\u306F\u4ED6\u306E\u30E6\u30FC\u30B6\u30FC\u306E\u6094\u7528',
        ],
        note: '\u8A2D\u5B9A\u30DA\u30FC\u30B8\u304B\u3089\u3044\u3064\u3067\u3082\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u524A\u9664\u3067\u304D\u307E\u3059\u3002',
      },
      changes: {
        title: '7. \u30B5\u30FC\u30D3\u30B9\u306E\u5909\u66F4',
        content: [
          '\u5F53\u793E\u306F\u3001\u4E8B\u524D\u306E\u901A\u77E5\u306A\u304F\u672C\u30B5\u30FC\u30D3\u30B9\u3092\u5909\u66F4\u3001\u505C\u6B62\u3001\u307E\u305F\u306F\u7D42\u4E86\u3059\u308B\u6A29\u5229\u3092\u6709\u3057\u307E\u3059\u3002\u30B5\u30FC\u30D3\u30B9\u306E\u5909\u66F4\u3001\u505C\u6B62\u3001\u7D42\u4E86\u306B\u3064\u3044\u3066\u8CAC\u4EFB\u3092\u8CA0\u3044\u307E\u305B\u3093\u3002',
        ],
      },
      contact: {
        title: '8. \u304A\u554F\u3044\u5408\u308F\u305B',
        content: [
          '\u672C\u898F\u7D04\u306B\u3064\u3044\u3066\u3054\u8CEA\u554F\u304C\u3042\u308B\u5834\u5408\u306F\u3001\u30A2\u30D7\u30EA\u5185\u306E\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u6A5F\u80FD\u307E\u305F\u306F support@sportsmatch.tokyo \u307E\u3067\u304A\u554F\u3044\u5408\u308F\u305B\u304F\u3060\u3055\u3044\u3002',
        ],
      },
    },
  },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  const content = locale === 'ja' ? TERMS_CONTENT.ja : TERMS_CONTENT.en;
  const s = content.sections;

  return (
    <LegalPageLayout
      title={content.title}
      lastUpdated={content.lastUpdated}
      backHref="/"
      backLabel={content.backLabel}
    >
      {/* Beta Disclaimer */}
      <DisclaimerBanner locale={locale} />

      {/* 1. Acceptance */}
      <LegalSection title={s.acceptance.title}>
        {s.acceptance.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </LegalSection>

      {/* 2. Cancellation Policy */}
      <LegalSection title={s.cancellation.title}>
        {s.cancellation.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <ul className="list-disc pl-6 space-y-2">
          {s.cancellation.rules.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>
        <p className="text-sm text-slate-500 italic mt-4">{s.cancellation.note}</p>
      </LegalSection>

      {/* 3. User Conduct */}
      <LegalSection title={s.conduct.title}>
        {s.conduct.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <p className="font-medium mt-4">
          {locale === 'ja' ? '\u7981\u6B62\u4E8B\u9805\uFF1A' : 'Prohibited activities:'}
        </p>
        <ul className="list-disc pl-6 space-y-2">
          {s.conduct.prohibited.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">{s.conduct.warning}</p>
        </div>
      </LegalSection>

      {/* 4. Host Responsibilities */}
      <LegalSection title={s.hosts.title}>
        {s.hosts.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <ul className="list-disc pl-6 space-y-2">
          {s.hosts.responsibilities.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p className="text-sm text-slate-500 italic mt-4">{s.hosts.note}</p>
      </LegalSection>

      {/* 5. Liability */}
      <LegalSection title={s.liability.title}>
        {s.liability.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <ul className="list-disc pl-6 space-y-2">
          {s.liability.disclaimers.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium">{s.liability.important}</p>
        </div>
      </LegalSection>

      {/* 6. Account Termination */}
      <LegalSection title={s.accounts.title}>
        {s.accounts.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <ul className="list-disc pl-6 space-y-2">
          {s.accounts.reasons.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p className="text-sm text-slate-500 italic mt-4">{s.accounts.note}</p>
      </LegalSection>

      {/* 7. Changes */}
      <LegalSection title={s.changes.title}>
        {s.changes.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </LegalSection>

      {/* 8. Contact */}
      <LegalSection title={s.contact.title}>
        {s.contact.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </LegalSection>
    </LegalPageLayout>
  );
}
