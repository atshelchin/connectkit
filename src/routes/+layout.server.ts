import type { LayoutServerLoad } from './$types.js';
import { extractLocaleFromPathname, extractLocaleFromCookie } from '../utils/common.js';
import { supportedLocales } from '../i18n/create-i18n.svelte.js';
export const load: LayoutServerLoad = async ({ cookies, url }) => {
    const locale =
        extractLocaleFromPathname(url.pathname) || extractLocaleFromCookie(cookies) || 'en'

    return {
        locale: supportedLocales.includes(locale) ? locale : 'en'
    };
};
