// import { getContext } from 'svelte';
import en from '../i18n/locales/en.json' with { type: 'json' };
import zh from '../i18n/locales/zh.json' with { type: 'json' };

import { useI18n as useI18n_ } from '@shelchin/i18n/svelte';
import type { PackageLocales } from '@shelchin/i18n';

export const PACKAGE_NAME = '@shelchin/connectkit';
export const locales = {
	en,
	zh
} as PackageLocales;

export const useI18n = () => {
	const i18n = useI18n_();
	i18n.register(PACKAGE_NAME, locales);

	return {
		...i18n,
		t: (key: string) => {
			return i18n.t(key, { package: PACKAGE_NAME });
		}
	};
};
// export const PACKAGE_NAME = '@shelchin/connectkit';
// export const I18N_KEY = 'i18n';
// export const locales = {
// 	en,
// 	zh
// } as const;

// export type I18nState = {
// 	locale: string;
// 	setLocale: (locale: string) => void;
// 	t: (key: string, PACKAGE_NAME: string, locales: Record<string, unknown>) => string;
// };
// export const t = (key: string) => {
// 	const i18n: I18nState = getContext(I18N_KEY);
// 	return i18n.t(key, PACKAGE_NAME, locales);
// };
// export const getI18n = () => {
// 	const i18n: I18nState = getContext(I18N_KEY);
// 	return i18n;
// };
