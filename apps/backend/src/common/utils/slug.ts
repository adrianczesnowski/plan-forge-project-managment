import { randomBytes } from 'node:crypto';

/** "Moja Firma Sp. z o.o." → "moja-firma-sp-z-o-o" */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

/** Short random suffix used to de-duplicate slugs (e.g. "moja-firma-x3f9"). */
export function randomSlugSuffix(): string {
  return randomBytes(2).toString('hex');
}
