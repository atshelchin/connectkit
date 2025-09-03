import type { LayoutServerLoad } from './$types.js';
import { extractLocaleFromPathname, extractLocaleFromCookie } from '../utils/common.js';
import { supportedLocales } from '../i18n/create-i18n.svelte.js';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const locale =
		extractLocaleFromPathname(url.pathname) || extractLocaleFromCookie(cookies) || 'en';

	// 从 cookie 中读取主题，默认为 'light'
	const theme = (cookies.get('theme') || 'light') as 'light' | 'dark';

	return {
		locale: supportedLocales.includes(locale) ? locale : 'en',
		theme
	};
};
