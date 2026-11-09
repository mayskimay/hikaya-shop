// Diese Werte stehen bei Vercel unter Settings → Environment Variables.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = '2025-01-01';

// Ohne Project-ID nutzt der Shop die Beispielprodukte aus src/lib/products.ts.
export const isSanityConfigured = projectId.length > 0;
