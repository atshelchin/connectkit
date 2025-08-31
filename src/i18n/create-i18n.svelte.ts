import { getContext, setContext } from 'svelte';
import type { Cookies } from '@sveltejs/kit';

import en from './locales/en.json' with { type: 'json' };
import zh from './locales/zh.json' with { type: 'json' };
import shelchin_connectkit_fr from './locales/@shelchin/connectkit/fr.json' with { type: 'json' };

interface Translations {
	[packageName: string]: {
		[locale: string]: Record<string, unknown>;
	};
}
export const supportedLocales = ['en', 'zh', 'fr'];
const PACKAGE_NAME = 'connectkit-demo';
const I18N_KEY = 'i18n';
const locale = $state('zh');
const locales = {
	en,
	zh
} as const;

const translations: Translations = {
	[PACKAGE_NAME]: locales,
	'@shelchin/connectkit': {
		fr: shelchin_connectkit_fr
	}
};

export type I18nState = {
	locale: string;
	setLocale: (locale: string) => void;
	t: (key: string, PACKAGE_NAME: string, locales: Record<string, unknown>) => string;
};

// 创建 i18n 状态，支持从 cookie 初始化
export function createI18nState(initialLocale?: string, cookies?: Cookies) {
	// 优先级：传入的值 > cookie > 默认值
	const defaultLocale = initialLocale || cookies?.get('locale') || 'zh';

	const state = $state({
		locale: defaultLocale
	});

	return {
		get locale() {
			return state.locale;
		},
		setLocale(newLocale: string) {
			state.locale = newLocale;

			// 如果在客户端
			if (typeof window !== 'undefined') {
				// 更新 cookie
				document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

				// 更新 URL pathname
				const currentPath = window.location.pathname;

				// 提取当前路径中的语言代码（如果有）
				const pathParts = currentPath.split('/').filter(Boolean);
				const currentLocaleInPath = supportedLocales.includes(pathParts[0]) ? pathParts[0] : null;

				let newPath: string;

				if (currentLocaleInPath) {
					// 替换现有的语言代码
					pathParts[0] = newLocale;
					newPath = '/' + pathParts.join('/');
				} else {
					// 添加语言代码到路径开头
					newPath = '/' + newLocale + (currentPath === '/' ? '' : currentPath);
				}

				// 使用 History API 更新 URL（不刷新页面）
				window.history.pushState({}, '', newPath);

				// 或者如果需要触发 SvelteKit 路由更新，可以使用：
				// import { goto } from '$app/navigation';
				// goto(newPath, { replaceState: true, keepFocus: true, noScroll: true });
			}
		},
		t(key: string, PACKAGE_NAME: string, locales: string) {
			// 根据 state.locale 返回翻译
			// 获取本地翻译
			const localTranslation = locales[state.locale as keyof typeof locales];

			// 获取外部传入的翻译（如果有包名空间）
			const externalTranslation = translations?.[PACKAGE_NAME]?.[state.locale];

			// 合并翻译，外部优先
			const mergedTranslation = deepMerge(externalTranslation, localTranslation);

			// 使用嵌套键获取值
			const value = getNestedValue(mergedTranslation, key);
			console.log({ value, locale, mergedTranslation, key });

			// 如果找到值且不是对象，返回它；否则返回键本身作为后备
			return value && typeof value !== 'object' ? String(value) : key;
		}
	};
}

// 获取嵌套对象的值，支持 "xx.yy.zz" 格式的键
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): any {
	return path.split('.').reduce((current, key) => current?.[key], obj);
}

// 深度合并两个对象，target 优先级更高
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: any, source: any): any {
	if (!source) return target;
	if (!target) return source;

	const result = { ...source };

	for (const key in target) {
		if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
			result[key] = deepMerge(target[key], source[key]);
		} else {
			result[key] = target[key];
		}
	}

	return result;
}

// 设置 i18n context
export function setupI18n(initialLocale?: string, cookies?: Cookies) {
	const i18n = createI18nState(initialLocale, cookies);
	setContext(I18N_KEY, i18n);
	return i18n;
}

// 获取 i18n context
export function getI18n(): I18nState {
	return getContext(I18N_KEY);
}

export const t = (key: string) => {
	const i18n: I18nState = getContext(I18N_KEY);
	return i18n.t(key, PACKAGE_NAME, locales);
};
