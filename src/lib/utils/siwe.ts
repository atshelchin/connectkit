import type { Address } from 'viem';
import type { SIWESession } from '$lib/connectors/types.js';

const SIWE_SESSION_KEY_PREFIX = 'connectkit.siwe.';

/**
 * Get storage key for address
 */
function getSessionKey(address: Address): string {
	return `${SIWE_SESSION_KEY_PREFIX}${address.toLowerCase()}`;
}

/**
 * Generate a random nonce for SIWE
 */
export function generateNonce(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a SIWE message
 */
export function createSIWEMessage(params: {
	address: Address;
	chainId: number;
	domain: string;
	nonce: string;
	statement?: string;
	uri?: string;
	version?: string;
	issuedAt?: string;
	expirationTime?: string;
}): string {
	const {
		address,
		chainId,
		domain,
		nonce,
		statement = 'Sign in with Ethereum to the app.',
		uri = typeof window !== 'undefined' ? window.location.origin : '',
		version = '1',
		issuedAt = new Date().toISOString(),
		expirationTime
	} = params;

	let message = `${domain} wants you to sign in with your Ethereum account:\n`;
	message += `${address}\n\n`;
	message += `${statement}\n\n`;
	message += `URI: ${uri}\n`;
	message += `Version: ${version}\n`;
	message += `Chain ID: ${chainId}\n`;
	message += `Nonce: ${nonce}\n`;
	message += `Issued At: ${issuedAt}`;

	if (expirationTime) {
		message += `\nExpiration Time: ${expirationTime}`;
	}

	return message;
}

/**
 * Store SIWE session for a specific address
 */
export function storeSIWESession(session: SIWESession): void {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return;
	}

	try {
		const key = getSessionKey(session.address);
		localStorage.setItem(key, JSON.stringify(session));
	} catch (error) {
		console.error('Failed to store SIWE session:', error);
	}
}

/**
 * Get stored SIWE session for a specific address
 */
export function getSIWESession(address: Address): SIWESession | null {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return null;
	}

	try {
		const key = getSessionKey(address);
		const stored = localStorage.getItem(key);
		if (!stored) return null;

		const session = JSON.parse(stored) as SIWESession;

		// Check if session is expired
		if (session.expirationTime) {
			const expiration = new Date(session.expirationTime);
			if (expiration < new Date()) {
				clearSIWESession(address);
				return null;
			}
		}

		return session;
	} catch (error) {
		console.error('Failed to get SIWE session:', error);
		return null;
	}
}

/**
 * Clear SIWE session for a specific address
 */
export function clearSIWESession(address: Address): void {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return;
	}

	try {
		const key = getSessionKey(address);
		localStorage.removeItem(key);
	} catch (error) {
		console.error('Failed to clear SIWE session:', error);
	}
}

/**
 * Clear all SIWE sessions
 */
export function clearAllSIWESessions(): void {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return;
	}

	try {
		// Get all keys that start with our prefix
		const keys = Object.keys(localStorage).filter((key) => key.startsWith(SIWE_SESSION_KEY_PREFIX));

		// Remove each session
		keys.forEach((key) => localStorage.removeItem(key));
	} catch (error) {
		console.error('Failed to clear all SIWE sessions:', error);
	}
}

/**
 * Check if address has valid SIWE session
 */
export function hasValidSIWESession(address: Address): boolean {
	const session = getSIWESession(address);
	return session !== null;
}
