import { getContext } from 'svelte';
import en from '../i18n/locales/en.json' with { type: 'json' };
import zh from '../i18n/locales/zh.json' with { type: 'json' };

export const PACKAGE_NAME = '@shelchin/connectkit';
export const I18N_KEY = 'i18n';
export const locales = {
	en,
	zh
} as const;

export type I18nState = {
	locale: string;
	setLocale: (locale: string) => void;
	t: (key: string, PACKAGE_NAME: string, locales: Record<string, unknown>) => string;
};
export const t = (key: string) => {
	const i18n: I18nState = getContext(I18N_KEY);
	return i18n.t(key, PACKAGE_NAME, locales);
};
export const getI18n = () => {
	const i18n: I18nState = getContext(I18N_KEY);
	return i18n;
};
