import LegalPageLayout, {
  LegalSection,
  DisclaimerBanner,
} from '@/app/components/layout/LegalPageLayout';

// Content stored directly in component to avoid bloating i18n bundle
const PRIVACY_CONTENT = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'November 2024',
    backLabel: 'Back',
    sections: {
      intro: {
        title: '1. Introduction',
        content: [
          'SportsMatch Tokyo ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our service.',
          'By using SportsMatch Tokyo, you agree to the collection and use of information as described in this policy.',
        ],
      },
      collection: {
        title: '2. Information We Collect',
        content: [
          'We collect the following types of information:',
        ],
        categories: {
          account: {
            title: 'Account Information',
            items: [
              'Email address (required for authentication)',
              'Display name and username',
              'Profile picture (optional)',
              'Phone number (optional, for verification)',
            ],
          },
          profile: {
            title: 'Profile Information',
            items: [
              'Bio and location',
              'Sport preferences and skill levels',
              'Native and target languages',
              'Language proficiency level',
            ],
          },
          usage: {
            title: 'Usage Information',
            items: [
              'Sessions you create or join',
              'Attendance and reliability score',
              'Messages sent within the platform',
              'Reviews and ratings you provide',
            ],
          },
        },
        note: 'We use Supabase for authentication. Your password is securely hashed and never stored in plain text.',
      },
      usage: {
        title: '3. How We Use Your Information',
        content: [
          'We use your information solely to provide and improve our service:',
        ],
        purposes: [
          'Match you with sports sessions based on your preferences',
          'Enable communication between session participants',
          'Display your profile to other users in shared sessions',
          'Calculate and display your reliability score',
          'Send session reminders and notifications',
          'Improve our platform and user experience',
        ],
        important: 'We do NOT sell your personal information to third parties.',
      },
      visibility: {
        title: '4. Information Visibility',
        content: [
          'Your information is visible to others as follows:',
        ],
        levels: [
          {
            category: 'Public (visible to all users)',
            items: ['Display name', 'Profile picture', 'Bio', 'Sport preferences', 'Reliability score'],
          },
          {
            category: 'Session participants only',
            items: ['Your participation in specific sessions', 'Messages in session chats'],
          },
          {
            category: 'Private (never shared)',
            items: ['Email address', 'Phone number', 'Password'],
          },
        ],
      },
      storage: {
        title: '5. Data Storage & Security',
        content: [
          'Your data is stored securely using industry-standard practices:',
        ],
        measures: [
          'Data is stored on Supabase (PostgreSQL) with encryption at rest',
          'All connections use HTTPS/TLS encryption',
          'Authentication is handled by Supabase Auth with secure session management',
          'We implement rate limiting to prevent abuse',
        ],
        note: 'While we take security seriously, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.',
      },
      retention: {
        title: '6. Data Retention',
        content: [
          'We retain your information as follows:',
        ],
        policies: [
          'Active account data: Retained while your account is active',
          'Session history: Retained for platform statistics and reliability scoring',
          'Messages: Retained until you delete your account',
          'Deleted account data: Permanently removed within 30 days of account deletion',
        ],
      },
      rights: {
        title: '7. Your Rights',
        content: [
          'You have the following rights regarding your personal data:',
        ],
        rights: [
          {
            right: 'Access',
            description: 'View your personal data in your Profile and Settings',
          },
          {
            right: 'Correction',
            description: 'Update your information at any time through the app',
          },
          {
            right: 'Deletion',
            description: 'Request account deletion from the Settings page',
          },
          {
            right: 'Data Export',
            description: 'Request a copy of your data by contacting support',
          },
        ],
      },
      cookies: {
        title: '8. Cookies & Local Storage',
        content: [
          'We use minimal cookies and local storage for:',
        ],
        purposes: [
          'Authentication session management',
          'Language preference (en/ja)',
          'Theme preference (if applicable)',
        ],
        note: 'We do not use tracking cookies or third-party analytics.',
      },
      children: {
        title: '9. Children\'s Privacy',
        content: [
          'SportsMatch Tokyo is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent and believe your child has provided us with personal information, please contact us.',
        ],
      },
      changes: {
        title: '10. Changes to This Policy',
        content: [
          'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.',
          'We encourage you to review this Privacy Policy periodically for any changes.',
        ],
      },
      contact: {
        title: '11. Contact Us',
        content: [
          'If you have any questions about this Privacy Policy or your personal data, please contact us:',
        ],
        methods: [
          'Through the app\'s feedback feature',
          'Email: support@sportsmatch.tokyo',
        ],
      },
    },
  },
  ja: {
    title: '\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC',
    lastUpdated: '2024\u5E7411\u6708',
    backLabel: '\u623B\u308B',
    sections: {
      intro: {
        title: '1. \u306F\u3058\u3081\u306B',
        content: [
          'SportsMatch Tokyo\uFF08\u4EE5\u4E0B\u300C\u5F53\u793E\u300D\uFF09\u306F\u3001\u304A\u5BA2\u69D8\u306E\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u4FDD\u8B77\u306B\u53D6\u308A\u7D44\u3093\u3067\u3044\u307E\u3059\u3002\u672C\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC\u306F\u3001\u5F53\u793E\u304C\u30B5\u30FC\u30D3\u30B9\u5229\u7528\u6642\u306B\u53CE\u96C6\u3001\u4F7F\u7528\u3001\u4FDD\u8B77\u3059\u308B\u500B\u4EBA\u60C5\u5831\u306B\u3064\u3044\u3066\u8AAC\u660E\u3057\u307E\u3059\u3002',
          'SportsMatch Tokyo\u3092\u5229\u7528\u3059\u308B\u3053\u3068\u3067\u3001\u672C\u30DD\u30EA\u30B7\u30FC\u306B\u8A18\u8F09\u3055\u308C\u305F\u60C5\u5831\u306E\u53CE\u96C6\u3068\u4F7F\u7528\u306B\u540C\u610F\u3057\u305F\u3082\u306E\u3068\u307F\u306A\u3055\u308C\u307E\u3059\u3002',
        ],
      },
      collection: {
        title: '2. \u53CE\u96C6\u3059\u308B\u60C5\u5831',
        content: [
          '\u4EE5\u4E0B\u306E\u7A2E\u985E\u306E\u60C5\u5831\u3092\u53CE\u96C6\u3057\u307E\u3059\uFF1A',
        ],
        categories: {
          account: {
            title: '\u30A2\u30AB\u30A6\u30F3\u30C8\u60C5\u5831',
            items: [
              '\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\uFF08\u8A8D\u8A3C\u306B\u5FC5\u8981\uFF09',
              '\u8868\u793A\u540D\u3068\u30E6\u30FC\u30B6\u30FC\u540D',
              '\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u753B\u50CF\uFF08\u4EFB\u610F\uFF09',
              '\u96FB\u8A71\u756A\u53F7\uFF08\u4EFB\u610F\u3001\u8A8D\u8A3C\u7528\uFF09',
            ],
          },
          profile: {
            title: '\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u60C5\u5831',
            items: [
              '\u81EA\u5DF1\u7D39\u4ECB\u3068\u5730\u57DF',
              '\u30B9\u30DD\u30FC\u30C4\u306E\u597D\u307F\u3068\u30B9\u30AD\u30EB\u30EC\u30D9\u30EB',
              '\u6BCD\u56FD\u8A9E\u3068\u5B66\u7FD2\u4E2D\u306E\u8A00\u8A9E',
              '\u8A00\u8A9E\u80FD\u529B\u30EC\u30D9\u30EB',
            ],
          },
          usage: {
            title: '\u5229\u7528\u60C5\u5831',
            items: [
              '\u4F5C\u6210\u307E\u305F\u306F\u53C2\u52A0\u3057\u305F\u30BB\u30C3\u30B7\u30E7\u30F3',
              '\u51FA\u6B20\u3068\u4FE1\u983C\u5EA6\u30B9\u30B3\u30A2',
              '\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u5185\u3067\u9001\u4FE1\u3057\u305F\u30E1\u30C3\u30BB\u30FC\u30B8',
              '\u30EC\u30D3\u30E5\u30FC\u3068\u8A55\u4FA1',
            ],
          },
        },
        note: '\u8A8D\u8A3C\u306B\u306FSupabase\u3092\u4F7F\u7528\u3057\u3066\u3044\u307E\u3059\u3002\u30D1\u30B9\u30EF\u30FC\u30C9\u306F\u5B89\u5168\u306B\u30CF\u30C3\u30B7\u30E5\u5316\u3055\u308C\u3001\u5E73\u6587\u3067\u306F\u4FDD\u5B58\u3055\u308C\u307E\u305B\u3093\u3002',
      },
      usage: {
        title: '3. \u60C5\u5831\u306E\u5229\u7528\u76EE\u7684',
        content: [
          '\u53CE\u96C6\u3057\u305F\u60C5\u5831\u306F\u3001\u30B5\u30FC\u30D3\u30B9\u306E\u63D0\u4F9B\u3068\u6539\u5584\u306E\u305F\u3081\u306B\u306E\u307F\u4F7F\u7528\u3057\u307E\u3059\uFF1A',
        ],
        purposes: [
          '\u304A\u597D\u307F\u306B\u57FA\u3065\u3044\u305F\u30B9\u30DD\u30FC\u30C4\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u30DE\u30C3\u30C1\u30F3\u30B0',
          '\u30BB\u30C3\u30B7\u30E7\u30F3\u53C2\u52A0\u8005\u9593\u306E\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u306E\u5B9F\u73FE',
          '\u5171\u6709\u30BB\u30C3\u30B7\u30E7\u30F3\u5185\u306E\u4ED6\u306E\u30E6\u30FC\u30B6\u30FC\u3078\u306E\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u8868\u793A',
          '\u4FE1\u983C\u5EA6\u30B9\u30B3\u30A2\u306E\u8A08\u7B97\u3068\u8868\u793A',
          '\u30BB\u30C3\u30B7\u30E7\u30F3\u30EA\u30DE\u30A4\u30F3\u30C0\u30FC\u3068\u901A\u77E5\u306E\u9001\u4FE1',
          '\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3068\u30E6\u30FC\u30B6\u30FC\u4F53\u9A13\u306E\u6539\u5584',
        ],
        important: '\u500B\u4EBA\u60C5\u5831\u3092\u7B2C\u4E09\u8005\u306B\u8CA9\u58F2\u3059\u308B\u3053\u3068\u306F\u3042\u308A\u307E\u305B\u3093\u3002',
      },
      visibility: {
        title: '4. \u60C5\u5831\u306E\u516C\u958B\u7BC4\u56F2',
        content: [
          '\u304A\u5BA2\u69D8\u306E\u60C5\u5831\u306F\u4EE5\u4E0B\u306E\u3088\u3046\u306B\u516C\u958B\u3055\u308C\u307E\u3059\uFF1A',
        ],
        levels: [
          {
            category: '\u516C\u958B\uFF08\u5168\u30E6\u30FC\u30B6\u30FC\u306B\u8868\u793A\uFF09',
            items: ['\u8868\u793A\u540D', '\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u753B\u50CF', '\u81EA\u5DF1\u7D39\u4ECB', '\u30B9\u30DD\u30FC\u30C4\u306E\u597D\u307F', '\u4FE1\u983C\u5EA6\u30B9\u30B3\u30A2'],
          },
          {
            category: '\u30BB\u30C3\u30B7\u30E7\u30F3\u53C2\u52A0\u8005\u306E\u307F',
            items: ['\u7279\u5B9A\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3078\u306E\u53C2\u52A0', '\u30BB\u30C3\u30B7\u30E7\u30F3\u30C1\u30E3\u30C3\u30C8\u5185\u306E\u30E1\u30C3\u30BB\u30FC\u30B8'],
          },
          {
            category: '\u975E\u516C\u958B\uFF08\u5171\u6709\u3055\u308C\u307E\u305B\u3093\uFF09',
            items: ['\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9', '\u96FB\u8A71\u756A\u53F7', '\u30D1\u30B9\u30EF\u30FC\u30C9'],
          },
        ],
      },
      storage: {
        title: '5. \u30C7\u30FC\u30BF\u306E\u4FDD\u5B58\u3068\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3',
        content: [
          '\u30C7\u30FC\u30BF\u306F\u696D\u754C\u6A19\u6E96\u306E\u65B9\u6CD5\u3067\u5B89\u5168\u306B\u4FDD\u5B58\u3055\u308C\u307E\u3059\uFF1A',
        ],
        measures: [
          '\u30C7\u30FC\u30BF\u306FSupabase\uFF08PostgreSQL\uFF09\u306B\u4FDD\u5B58\u30FB\u6697\u53F7\u5316',
          '\u3059\u3079\u3066\u306E\u63A5\u7D9A\u306FHTTPS/TLS\u6697\u53F7\u5316\u3092\u4F7F\u7528',
          '\u8A8D\u8A3C\u306FSupabase Auth\u306B\u3088\u308B\u5B89\u5168\u306A\u30BB\u30C3\u30B7\u30E7\u30F3\u7BA1\u7406',
          '\u4E0D\u6B63\u4F7F\u7528\u9632\u6B62\u306E\u305F\u3081\u306E\u30EC\u30FC\u30C8\u5236\u9650\u3092\u5B9F\u88C5',
        ],
        note: '\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306B\u306F\u7D30\u5FC3\u306E\u6CE8\u610F\u3092\u6255\u3063\u3066\u3044\u307E\u3059\u304C\u3001\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u4E0A\u306E\u901A\u4FE1\u306F100\%\u5B89\u5168\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u7D76\u5BFE\u7684\u306A\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3092\u4FDD\u8A3C\u3059\u308B\u3053\u3068\u306F\u3067\u304D\u307E\u305B\u3093\u3002',
      },
      retention: {
        title: '6. \u30C7\u30FC\u30BF\u306E\u4FDD\u6301\u671F\u9593',
        content: [
          '\u60C5\u5831\u306F\u4EE5\u4E0B\u306E\u3088\u3046\u306B\u4FDD\u6301\u3055\u308C\u307E\u3059\uFF1A',
        ],
        policies: [
          '\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30A2\u30AB\u30A6\u30F3\u30C8\u30C7\u30FC\u30BF\uFF1A\u30A2\u30AB\u30A6\u30F3\u30C8\u304C\u6709\u52B9\u306A\u9593\u4FDD\u6301',
          '\u30BB\u30C3\u30B7\u30E7\u30F3\u5C65\u6B74\uFF1A\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u7D71\u8A08\u3068\u4FE1\u983C\u5EA6\u30B9\u30B3\u30A2\u7528\u306B\u4FDD\u6301',
          '\u30E1\u30C3\u30BB\u30FC\u30B8\uFF1A\u30A2\u30AB\u30A6\u30F3\u30C8\u524A\u9664\u307E\u3067\u4FDD\u6301',
          '\u524A\u9664\u3055\u308C\u305F\u30A2\u30AB\u30A6\u30F3\u30C8\u30C7\u30FC\u30BF\uFF1A\u30A2\u30AB\u30A6\u30F3\u30C8\u524A\u9664\u304B\u308930\u65E5\u4EE5\u5185\u306B\u5B8C\u5168\u524A\u9664',
        ],
      },
      rights: {
        title: '7. \u304A\u5BA2\u69D8\u306E\u6A29\u5229',
        content: [
          '\u500B\u4EBA\u30C7\u30FC\u30BF\u306B\u95A2\u3057\u3066\u4EE5\u4E0B\u306E\u6A29\u5229\u304C\u3042\u308A\u307E\u3059\uFF1A',
        ],
        rights: [
          {
            right: '\u30A2\u30AF\u30BB\u30B9',
            description: '\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3068\u8A2D\u5B9A\u3067\u500B\u4EBA\u30C7\u30FC\u30BF\u3092\u78BA\u8A8D',
          },
          {
            right: '\u8A02\u6B63',
            description: '\u30A2\u30D7\u30EA\u304B\u3089\u3044\u3064\u3067\u3082\u60C5\u5831\u3092\u66F4\u65B0\u53EF\u80FD',
          },
          {
            right: '\u524A\u9664',
            description: '\u8A2D\u5B9A\u30DA\u30FC\u30B8\u304B\u3089\u30A2\u30AB\u30A6\u30F3\u30C8\u524A\u9664\u3092\u30EA\u30AF\u30A8\u30B9\u30C8',
          },
          {
            right: '\u30C7\u30FC\u30BF\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8',
            description: '\u30B5\u30DD\u30FC\u30C8\u306B\u9023\u7D61\u3057\u3066\u30C7\u30FC\u30BF\u306E\u30B3\u30D4\u30FC\u3092\u30EA\u30AF\u30A8\u30B9\u30C8',
          },
        ],
      },
      cookies: {
        title: '8. Cookie\u3068\u30ED\u30FC\u30AB\u30EB\u30B9\u30C8\u30EC\u30FC\u30B8',
        content: [
          '\u4EE5\u4E0B\u306E\u76EE\u7684\u3067\u6700\u5C0F\u9650\u306ECookie\u3068\u30ED\u30FC\u30AB\u30EB\u30B9\u30C8\u30EC\u30FC\u30B8\u3092\u4F7F\u7528\u3057\u307E\u3059\uFF1A',
        ],
        purposes: [
          '\u8A8D\u8A3C\u30BB\u30C3\u30B7\u30E7\u30F3\u7BA1\u7406',
          '\u8A00\u8A9E\u8A2D\u5B9A\uFF08en/ja\uFF09',
          '\u30C6\u30FC\u30DE\u8A2D\u5B9A\uFF08\u8A72\u5F53\u3059\u308B\u5834\u5408\uFF09',
        ],
        note: '\u30C8\u30E9\u30C3\u30AD\u30F3\u30B0Cookie\u3084\u30B5\u30FC\u30C9\u30D1\u30FC\u30C6\u30A3\u5206\u6790\u306F\u4F7F\u7528\u3057\u3066\u3044\u307E\u305B\u3093\u3002',
      },
      children: {
        title: '9. \u304A\u5B50\u69D8\u306E\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC',
        content: [
          'SportsMatch Tokyo\u306F13\u6B73\u672A\u6E80\u306E\u304A\u5B50\u69D8\u3092\u5BFE\u8C61\u3068\u3057\u305F\u30B5\u30FC\u30D3\u30B9\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u300213\u6B73\u672A\u6E80\u306E\u304A\u5B50\u69D8\u304B\u3089\u610F\u56F3\u7684\u306B\u500B\u4EBA\u60C5\u5831\u3092\u53CE\u96C6\u3059\u308B\u3053\u3068\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u4FDD\u8B77\u8005\u306E\u65B9\u3067\u3001\u304A\u5B50\u69D8\u304C\u500B\u4EBA\u60C5\u5831\u3092\u63D0\u4F9B\u3057\u305F\u3068\u601D\u308F\u308C\u308B\u5834\u5408\u306F\u3001\u3054\u9023\u7D61\u304F\u3060\u3055\u3044\u3002',
        ],
      },
      changes: {
        title: '10. \u30DD\u30EA\u30B7\u30FC\u306E\u5909\u66F4',
        content: [
          '\u672C\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC\u306F\u968F\u6642\u66F4\u65B0\u3055\u308C\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002\u5909\u66F4\u304C\u3042\u3063\u305F\u5834\u5408\u306F\u3001\u672C\u30DA\u30FC\u30B8\u306B\u65B0\u3057\u3044\u30DD\u30EA\u30B7\u30FC\u3092\u63B2\u8F09\u3057\u3001\u300C\u6700\u7D42\u66F4\u65B0\u65E5\u300D\u3092\u66F4\u65B0\u3057\u307E\u3059\u3002',
          '\u5B9A\u671F\u7684\u306B\u672C\u30DD\u30EA\u30B7\u30FC\u3092\u78BA\u8A8D\u3055\u308C\u308B\u3053\u3068\u3092\u304A\u52E7\u3081\u3057\u307E\u3059\u3002',
        ],
      },
      contact: {
        title: '11. \u304A\u554F\u3044\u5408\u308F\u305B',
        content: [
          '\u672C\u30DD\u30EA\u30B7\u30FC\u307E\u305F\u306F\u500B\u4EBA\u30C7\u30FC\u30BF\u306B\u3064\u3044\u3066\u3054\u8CEA\u554F\u304C\u3042\u308B\u5834\u5408\u306F\u3001\u4EE5\u4E0B\u307E\u3067\u304A\u554F\u3044\u5408\u308F\u305B\u304F\u3060\u3055\u3044\uFF1A',
        ],
        methods: [
          '\u30A2\u30D7\u30EA\u5185\u306E\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u6A5F\u80FD',
          '\u30E1\u30FC\u30EB: support@sportsmatch.tokyo',
        ],
      },
    },
  },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  const content = locale === 'ja' ? PRIVACY_CONTENT.ja : PRIVACY_CONTENT.en;
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

      {/* 1. Introduction */}
      <LegalSection title={s.intro.title}>
        {s.intro.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </LegalSection>

      {/* 2. Information We Collect */}
      <LegalSection title={s.collection.title}>
        {s.collection.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}

        {/* Account Info */}
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-medium text-slate-800">{s.collection.categories.account.title}</h4>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              {s.collection.categories.account.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-slate-800">{s.collection.categories.profile.title}</h4>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              {s.collection.categories.profile.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-slate-800">{s.collection.categories.usage.title}</h4>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              {s.collection.categories.usage.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-sm text-slate-500 italic mt-4">{s.collection.note}</p>
      </LegalSection>

      {/* 3. How We Use Information */}
      <LegalSection title={s.usage.title}>
        {s.usage.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <ul className="list-disc pl-6 space-y-2">
          {s.usage.purposes.map((purpose, i) => (
            <li key={i}>{purpose}</li>
          ))}
        </ul>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">{s.usage.important}</p>
        </div>
      </LegalSection>

      {/* 4. Information Visibility */}
      <LegalSection title={s.visibility.title}>
        {s.visibility.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <div className="space-y-4 mt-4">
          {s.visibility.levels.map((level, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-800 mb-2">{level.category}</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                {level.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </LegalSection>

      {/* 5. Data Storage */}
      <LegalSection title={s.storage.title}>
        {s.storage.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <ul className="list-disc pl-6 space-y-2">
          {s.storage.measures.map((measure, i) => (
            <li key={i}>{measure}</li>
          ))}
        </ul>
        <p className="text-sm text-slate-500 italic mt-4">{s.storage.note}</p>
      </LegalSection>

      {/* 6. Data Retention */}
      <LegalSection title={s.retention.title}>
        {s.retention.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <ul className="list-disc pl-6 space-y-2">
          {s.retention.policies.map((policy, i) => (
            <li key={i}>{policy}</li>
          ))}
        </ul>
      </LegalSection>

      {/* 7. Your Rights */}
      <LegalSection title={s.rights.title}>
        {s.rights.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <div className="space-y-3 mt-4">
          {s.rights.rights.map((r, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-medium text-slate-800 min-w-[100px]">{r.right}:</span>
              <span>{r.description}</span>
            </div>
          ))}
        </div>
      </LegalSection>

      {/* 8. Cookies */}
      <LegalSection title={s.cookies.title}>
        {s.cookies.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <ul className="list-disc pl-6 space-y-2">
          {s.cookies.purposes.map((purpose, i) => (
            <li key={i}>{purpose}</li>
          ))}
        </ul>
        <p className="text-sm text-slate-500 italic mt-4">{s.cookies.note}</p>
      </LegalSection>

      {/* 9. Children */}
      <LegalSection title={s.children.title}>
        {s.children.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </LegalSection>

      {/* 10. Changes */}
      <LegalSection title={s.changes.title}>
        {s.changes.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </LegalSection>

      {/* 11. Contact */}
      <LegalSection title={s.contact.title}>
        {s.contact.content.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <ul className="list-disc pl-6 space-y-2">
          {s.contact.methods.map((method, i) => (
            <li key={i}>{method}</li>
          ))}
        </ul>
      </LegalSection>
    </LegalPageLayout>
  );
}
