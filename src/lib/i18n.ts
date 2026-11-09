export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'de' ? 'de-AT' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
