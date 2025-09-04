<script lang="ts">
	interface Props {
		address: string;
		ensImage?: string | null;
		ensName?: string | null;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		rounded?: boolean;
		alt?: string;
		showBadge?: boolean;
	}

	let {
		address,
		ensImage = null,
		ensName = null,
		size = 'md',
		rounded = true,
		alt = 'Avatar',
		showBadge = true
	}: Props = $props();

	// Size mapping
	const sizeMap = {
		xs: 24,
		sm: 32,
		md: 40,
		lg: 48,
		xl: 64
	};

	// Get size in pixels
	const pixels = $derived(sizeMap[size]);

	// Validate Ethereum address
	function isValidEthereumAddress(addr: string): boolean {
		if (!addr || typeof addr !== 'string') return false;
		// Check if it's a valid Ethereum address (0x followed by 40 hex characters)
		return /^0x[a-fA-F0-9]{40}$/.test(addr);
	}

	// Generate vibrant colors from address
	function generateColors(addr: string): { bg: string; fg: string; emoji: string } {
		if (!addr || typeof addr !== 'string') {
			return { bg: '#A0AEC0', fg: '#F7FAFC', emoji: '🔮' }; // Default fallback
		}

		const seed = addr.toLowerCase().replace('0x', '');

		// Ensure we have valid seed
		if (!seed || seed.length < 8) {
			// Use a hash of the address if it's too short
			let hash = 0;
			for (let i = 0; i < addr.length; i++) {
				hash = (hash << 5) - hash + addr.charCodeAt(i);
				hash = hash & hash; // Convert to 32bit integer
			}
			const fallbackSchemes = [
				{ bg: '#667EEA', fg: '#F7FAFC', emoji: '🚀' },
				{ bg: '#F56565', fg: '#FFF5F5', emoji: '🔥' },
				{ bg: '#48BB78', fg: '#F0FFF4', emoji: '🌿' },
				{ bg: '#ED8936', fg: '#FFFDF7', emoji: '🎯' },
				{ bg: '#38B2AC', fg: '#E6FFFA', emoji: '💎' },
				{ bg: '#9F7AEA', fg: '#FAF5FF', emoji: '✨' },
				{ bg: '#ED64A6', fg: '#FFF5F7', emoji: '🌸' },
				{ bg: '#4299E1', fg: '#EBF8FF', emoji: '🌊' },
				{ bg: '#ECC94B', fg: '#FFFFF0', emoji: '⭐' },
				{ bg: '#A0AEC0', fg: '#F7FAFC', emoji: '🔮' },
				{ bg: '#FC8181', fg: '#FFF5F5', emoji: '❤️' },
				{ bg: '#63B3ED', fg: '#EBF8FF', emoji: '☁️' },
				{ bg: '#B794F4', fg: '#FAF5FF', emoji: '🦄' },
				{ bg: '#81E6D9', fg: '#E6FFFA', emoji: '🌺' },
				{ bg: '#FBB6CE', fg: '#FFF5F7', emoji: '🌷' },
				{ bg: '#F6AD55', fg: '#FFFDF7', emoji: '🌅' },
				{ bg: '#805AD5', fg: '#FAF5FF', emoji: '🦊' },
				{ bg: '#2D3748', fg: '#EDF2F7', emoji: '🐺' },
				{ bg: '#2B6CB0', fg: '#EBF8FF', emoji: '🐳' },
				{ bg: '#D69E2E', fg: '#FFFFF0', emoji: '🦁' },
				{ bg: '#319795', fg: '#E6FFFA', emoji: '🦋' },
				{ bg: '#744210', fg: '#FFF7ED', emoji: '🐻' },
				{ bg: '#97266D', fg: '#FFF5F7', emoji: '🦩' },
				{ bg: '#22543D', fg: '#F0FFF4', emoji: '🐸' },
				{ bg: '#553C9A', fg: '#FAF5FF', emoji: '🌙' },
				{ bg: '#C05621', fg: '#FFFDF7', emoji: '🍂' },
				{ bg: '#2C5282', fg: '#EBF8FF', emoji: '❄️' },
				{ bg: '#234E52', fg: '#E6FFFA', emoji: '🌲' },
				{ bg: '#702459', fg: '#FFF5F7', emoji: '🍇' },
				{ bg: '#7B341E', fg: '#FFF7ED', emoji: '🍄' },
				{ bg: '#1A365D', fg: '#EBF8FF', emoji: '🌌' },
				{ bg: '#742A2A', fg: '#FFF5F5', emoji: '🍒' }
			];
			const index = Math.abs(hash) % fallbackSchemes.length;
			return fallbackSchemes[index];
		}

		// Define vibrant color schemes - original 64 combinations preserved
		const colorSchemes = [
			// Original 64 - DO NOT REORDER (preserves existing avatars)
			{ bg: '#667EEA', fg: '#F7FAFC', emoji: '🚀' }, // Purple
			{ bg: '#F56565', fg: '#FFF5F5', emoji: '🔥' }, // Red
			{ bg: '#48BB78', fg: '#F0FFF4', emoji: '🌿' }, // Green
			{ bg: '#ED8936', fg: '#FFFDF7', emoji: '🎯' }, // Orange
			{ bg: '#38B2AC', fg: '#E6FFFA', emoji: '💎' }, // Teal
			{ bg: '#9F7AEA', fg: '#FAF5FF', emoji: '✨' }, // Purple
			{ bg: '#ED64A6', fg: '#FFF5F7', emoji: '🌸' }, // Pink
			{ bg: '#4299E1', fg: '#EBF8FF', emoji: '🌊' }, // Blue
			{ bg: '#ECC94B', fg: '#FFFFF0', emoji: '⭐' }, // Yellow
			{ bg: '#A0AEC0', fg: '#F7FAFC', emoji: '🔮' }, // Gray
			{ bg: '#FC8181', fg: '#FFF5F5', emoji: '❤️' }, // Light Red
			{ bg: '#63B3ED', fg: '#EBF8FF', emoji: '☁️' }, // Sky Blue
			{ bg: '#B794F4', fg: '#FAF5FF', emoji: '🦄' }, // Lavender
			{ bg: '#81E6D9', fg: '#E6FFFA', emoji: '🌺' }, // Aqua
			{ bg: '#FBB6CE', fg: '#FFF5F7', emoji: '🌷' }, // Rose
			{ bg: '#F6AD55', fg: '#FFFDF7', emoji: '🌅' }, // Peach
			{ bg: '#805AD5', fg: '#FAF5FF', emoji: '🦊' }, // Deep Purple - Fox
			{ bg: '#2D3748', fg: '#EDF2F7', emoji: '🐺' }, // Dark Gray - Wolf
			{ bg: '#2B6CB0', fg: '#EBF8FF', emoji: '🐳' }, // Ocean Blue - Whale
			{ bg: '#D69E2E', fg: '#FFFFF0', emoji: '🦁' }, // Gold - Lion
			{ bg: '#319795', fg: '#E6FFFA', emoji: '🦋' }, // Turquoise - Butterfly
			{ bg: '#744210', fg: '#FFF7ED', emoji: '🐻' }, // Brown - Bear
			{ bg: '#97266D', fg: '#FFF5F7', emoji: '🦩' }, // Magenta - Flamingo
			{ bg: '#22543D', fg: '#F0FFF4', emoji: '🐸' }, // Forest Green - Frog
			{ bg: '#553C9A', fg: '#FAF5FF', emoji: '🌙' }, // Violet - Moon
			{ bg: '#C05621', fg: '#FFFDF7', emoji: '🍂' }, // Burnt Orange - Autumn Leaf
			{ bg: '#2C5282', fg: '#EBF8FF', emoji: '❄️' }, // Deep Blue - Snowflake
			{ bg: '#234E52', fg: '#E6FFFA', emoji: '🌲' }, // Pine Green - Tree
			{ bg: '#702459', fg: '#FFF5F7', emoji: '🍇' }, // Wine - Grapes
			{ bg: '#7B341E', fg: '#FFF7ED', emoji: '🍄' }, // Rust - Mushroom
			{ bg: '#1A365D', fg: '#EBF8FF', emoji: '🌌' }, // Navy - Galaxy
			{ bg: '#742A2A', fg: '#FFF5F5', emoji: '🍒' }, // Maroon - Cherry
			{ bg: '#2F855A', fg: '#F0FFF4', emoji: '🎮' }, // Emerald - Gaming
			{ bg: '#3182CE', fg: '#EBF8FF', emoji: '🎨' }, // Bright Blue - Art
			{ bg: '#D53F8C', fg: '#FFF5F7', emoji: '🎭' }, // Hot Pink - Theater
			{ bg: '#38A169', fg: '#F0FFF4', emoji: '🎲' }, // Green - Dice
			{ bg: '#E53E3E', fg: '#FFF5F5', emoji: '🎸' }, // Red - Guitar
			{ bg: '#DD6B20', fg: '#FFFDF7', emoji: '🎺' }, // Orange - Trumpet
			{ bg: '#5A67D8', fg: '#FAF5FF', emoji: '🎹' }, // Indigo - Piano
			{ bg: '#B7791F', fg: '#FFFFF0', emoji: '🎻' }, // Amber - Violin
			{ bg: '#C53030', fg: '#FFF5F5', emoji: '🍓' }, // Strawberry Red
			{ bg: '#2F855A', fg: '#F0FFF4', emoji: '🥝' }, // Kiwi Green
			{ bg: '#ED8936', fg: '#FFFDF7', emoji: '🥕' }, // Carrot Orange
			{ bg: '#5F370E', fg: '#FFF7ED', emoji: '☕' }, // Coffee Brown

			// NEW EMOJIS - Added after original 44 to preserve existing avatars
			// Food & Drinks (extended)
			{ bg: '#F6E05E', fg: '#FFFFF0', emoji: '🍋' }, // Lemon Yellow
			{ bg: '#9C4221', fg: '#FFF7ED', emoji: '🍕' }, // Pizza Brown
			{ bg: '#065F46', fg: '#F0FFF4', emoji: '🥑' }, // Avocado Green
			{ bg: '#B91C1C', fg: '#FFF5F5', emoji: '🍎' }, // Apple Red
			{ bg: '#7C2D12', fg: '#FFF7ED', emoji: '🍫' }, // Chocolate Brown
			{ bg: '#EA580C', fg: '#FFFDF7', emoji: '🍊' }, // Orange
			{ bg: '#84CC16', fg: '#F0FFF4', emoji: '🍏' }, // Green Apple
			{ bg: '#7E22CE', fg: '#FAF5FF', emoji: '🍆' }, // Eggplant Purple

			// More Animals
			{ bg: '#0891B2', fg: '#E6FFFA', emoji: '🐬' }, // Dolphin Blue
			{ bg: '#DC2626', fg: '#FFF5F5', emoji: '🦀' }, // Crab Red
			{ bg: '#16A34A', fg: '#F0FFF4', emoji: '🦎' }, // Lizard Green
			{ bg: '#CA8A04', fg: '#FFFFF0', emoji: '🦒' }, // Giraffe Yellow
			{ bg: '#1E40AF', fg: '#EBF8FF', emoji: '🦈' }, // Shark Blue
			{ bg: '#BE185D', fg: '#FFF5F7', emoji: '🦜' }, // Parrot Pink
			{ bg: '#166534', fg: '#F0FFF4', emoji: '🐢' }, // Turtle Green
			{ bg: '#6B21A8', fg: '#FAF5FF', emoji: '🦑' }, // Squid Purple
			{ bg: '#B45309', fg: '#FFFDF7', emoji: '🦘' }, // Kangaroo Brown
			{ bg: '#0E7490', fg: '#E6FFFA', emoji: '🐧' }, // Penguin Blue
			{ bg: '#A21CAF', fg: '#FAF5FF', emoji: '🦚' }, // Peacock Purple
			{ bg: '#15803D', fg: '#F0FFF4', emoji: '🦖' }, // Dinosaur Green

			// Fantasy & Magic
			{ bg: '#581C87', fg: '#FAF5FF', emoji: '🧙' }, // Wizard Purple
			{ bg: '#BE123C', fg: '#FFF5F7', emoji: '🧚' }, // Fairy Pink
			{ bg: '#0F766E', fg: '#E6FFFA', emoji: '🧜' }, // Mermaid Teal
			{ bg: '#A16207', fg: '#FFFFF0', emoji: '👑' }, // Crown Gold
			{ bg: '#1E3A8A', fg: '#EBF8FF', emoji: '🧊' }, // Ice Blue
			{ bg: '#14532D', fg: '#F0FFF4', emoji: '🍀' }, // Clover Green
			{ bg: '#6D28D9', fg: '#FAF5FF', emoji: '💜' }, // Purple Heart

			// Space & Science
			{ bg: '#7C3AED', fg: '#FAF5FF', emoji: '👽' }, // Alien Purple
			{ bg: '#0369A1', fg: '#EBF8FF', emoji: '🛸' }, // UFO Blue
			{ bg: '#B91C1C', fg: '#FFF5F5', emoji: '🪐' }, // Planet Red
			{ bg: '#0D9488', fg: '#E6FFFA', emoji: '🧬' }, // DNA Teal
			{ bg: '#EA580C', fg: '#FFFDF7', emoji: '☄️' }, // Comet Orange
			{ bg: '#4338CA', fg: '#FAF5FF', emoji: '🌠' }, // Shooting Star Indigo
			{ bg: '#065F46', fg: '#F0FFF4', emoji: '🦠' }, // Microbe Green

			// Sports & Games
			{ bg: '#15803D', fg: '#F0FFF4', emoji: '⚽' }, // Soccer Green
			{ bg: '#EA580C', fg: '#FFFDF7', emoji: '🏀' }, // Basketball Orange
			{ bg: '#1E40AF', fg: '#EBF8FF', emoji: '🏈' }, // Football Blue
			{ bg: '#7E22CE', fg: '#FAF5FF', emoji: '🎱' }, // Billiards Purple
			{ bg: '#CA8A04', fg: '#FFFFF0', emoji: '🏆' }, // Trophy Gold
			{ bg: '#0891B2', fg: '#E6FFFA', emoji: '🏊' }, // Swimming Blue
			{ bg: '#16A34A', fg: '#F0FFF4', emoji: '🎾' }, // Tennis Green

			// Weather & Nature
			{ bg: '#0369A1', fg: '#EBF8FF', emoji: '🌧️' }, // Rain Blue
			{ bg: '#FCD34D', fg: '#FFFFF0', emoji: '☀️' }, // Sun Yellow
			{ bg: '#6366F1', fg: '#FAF5FF', emoji: '⛈️' }, // Storm Indigo
			{ bg: '#10B981', fg: '#F0FFF4', emoji: '🌴' }, // Palm Tree Green
			{ bg: '#F97316', fg: '#FFFDF7', emoji: '🌋' }, // Volcano Orange
			{ bg: '#06B6D4', fg: '#E6FFFA', emoji: '🌊' }, // Wave Cyan
			{ bg: '#8B5CF6', fg: '#FAF5FF', emoji: '🌈' }, // Rainbow Purple
			{ bg: '#14B8A6', fg: '#E6FFFA', emoji: '🏔️' }, // Mountain Teal

			// Faces & Emotions
			{ bg: '#F59E0B', fg: '#FFFFF0', emoji: '😊' }, // Happy Yellow
			{ bg: '#EC4899', fg: '#FFF5F7', emoji: '😍' }, // Love Pink
			{ bg: '#3B82F6', fg: '#EBF8FF', emoji: '😎' }, // Cool Blue
			{ bg: '#10B981', fg: '#F0FFF4', emoji: '🤑' }, // Money Green
			{ bg: '#8B5CF6', fg: '#FAF5FF', emoji: '😈' }, // Devil Purple
			{ bg: '#EF4444', fg: '#FFF5F5', emoji: '😡' }, // Angry Red
			{ bg: '#06B6D4', fg: '#E6FFFA', emoji: '🥶' }, // Cold Cyan
			{ bg: '#F97316', fg: '#FFFDF7', emoji: '🤠' }, // Cowboy Orange
			{ bg: '#84CC16', fg: '#F0FFF4', emoji: '🌱' } // Sprout Green
		];

		// Select color scheme based on address
		const hexPart = seed.slice(0, 8);
		const index = parseInt(hexPart, 16);
		if (isNaN(index)) {
			// Fallback to hash-based selection
			let hash = 0;
			for (let i = 0; i < seed.length; i++) {
				hash = (hash << 5) - hash + seed.charCodeAt(i);
				hash = hash & hash;
			}
			return colorSchemes[Math.abs(hash) % colorSchemes.length];
		}
		return colorSchemes[index % colorSchemes.length];
	}

	// Generate avatar with emoji and pattern
	function generateAvatar(addr: string): { svg: string; emoji: string; color: string } {
		// Check if address is valid
		if (!addr || !isValidEthereumAddress(addr)) {
			// Return a generic avatar for invalid addresses
			const invalidScheme = { bg: '#718096', fg: '#EDF2F7', emoji: '❓' };
			const svgString = `
				<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
					<rect width="100" height="100" fill="${invalidScheme.bg}"/>
					<foreignObject x="0" y="0" width="100" height="100">
						<div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 60px; line-height: 1;">
							${invalidScheme.emoji}
						</div>
					</foreignObject>
				</svg>
			`;
			const svg =
				typeof window !== 'undefined'
					? `data:image/svg+xml;base64,${btoa(encodeURIComponent(svgString))}`
					: `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
			return { svg, emoji: invalidScheme.emoji, color: invalidScheme.bg };
		}

		const scheme = generateColors(addr);
		if (!scheme || !scheme.bg || !scheme.fg || !scheme.emoji) {
			// Fallback if scheme generation fails
			return { svg: '', emoji: '👤', color: '#A0AEC0' };
		}

		const seed = addr.toLowerCase().replace('0x', '');

		// Determine pattern type based on address
		const patternType = parseInt(seed.slice(8, 10), 16) % 8;

		let pattern = '';

		switch (patternType) {
			case 0: // Dots pattern
				for (let i = 0; i < 5; i++) {
					for (let j = 0; j < 5; j++) {
						const x = 10 + i * 20;
						const y = 10 + j * 20;
						pattern += `<circle cx="${x}" cy="${y}" r="3" fill="${scheme.fg}" opacity="0.2"/>`;
					}
				}
				break;

			case 1: // Lines pattern
				for (let i = 0; i < 5; i++) {
					const y = 10 + i * 20;
					pattern += `<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="${scheme.fg}" stroke-width="1" opacity="0.15"/>`;
				}
				break;

			case 2: // Diagonal lines
				for (let i = -4; i < 10; i++) {
					const x = i * 15;
					pattern += `<line x1="${x}" y1="0" x2="${x + 100}" y2="100" stroke="${scheme.fg}" stroke-width="1" opacity="0.15"/>`;
				}
				break;

			case 3: // Circles
				pattern = `
					<circle cx="30" cy="30" r="20" fill="${scheme.fg}" opacity="0.1"/>
					<circle cx="70" cy="70" r="20" fill="${scheme.fg}" opacity="0.1"/>
					<circle cx="70" cy="30" r="15" fill="${scheme.fg}" opacity="0.08"/>
					<circle cx="30" cy="70" r="15" fill="${scheme.fg}" opacity="0.08"/>
				`;
				break;

			case 4: // Squares
				pattern = `
					<rect x="20" y="20" width="25" height="25" fill="${scheme.fg}" opacity="0.1" transform="rotate(15 32.5 32.5)"/>
					<rect x="55" y="55" width="25" height="25" fill="${scheme.fg}" opacity="0.1" transform="rotate(15 67.5 67.5)"/>
					<rect x="55" y="20" width="20" height="20" fill="${scheme.fg}" opacity="0.08" transform="rotate(-15 65 30)"/>
					<rect x="20" y="55" width="20" height="20" fill="${scheme.fg}" opacity="0.08" transform="rotate(-15 30 65)"/>
				`;
				break;

			case 5: // Hexagon-like
				pattern = `
					<polygon points="50,20 70,35 70,65 50,80 30,65 30,35" fill="${scheme.fg}" opacity="0.15"/>
					<polygon points="50,35 60,42.5 60,57.5 50,65 40,57.5 40,42.5" fill="${scheme.fg}" opacity="0.1"/>
				`;
				break;

			case 6: // Cross pattern
				for (let i = 0; i < 4; i++) {
					for (let j = 0; j < 4; j++) {
						const x = 12.5 + i * 25;
						const y = 12.5 + j * 25;
						pattern += `
							<line x1="${x - 5}" y1="${y}" x2="${x + 5}" y2="${y}" stroke="${scheme.fg}" stroke-width="1.5" opacity="0.15"/>
							<line x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}" stroke="${scheme.fg}" stroke-width="1.5" opacity="0.15"/>
						`;
					}
				}
				break;

			case 7: // Triangle pattern
			default:
				pattern = `
					<polygon points="50,20 75,70 25,70" fill="${scheme.fg}" opacity="0.1"/>
					<polygon points="50,40 65,65 35,65" fill="${scheme.fg}" opacity="0.08"/>
				`;
				break;
		}

		// Create the SVG with emoji in center
		const svgString = `
			<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
				<rect width="100" height="100" fill="${scheme.bg}"/>
				${pattern}
				<foreignObject x="0" y="0" width="100" height="100">
					<div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 55px; line-height: 1;">
						${scheme.emoji}
					</div>
				</foreignObject>
			</svg>
		`;

		// Encode SVG string to base64, handling Unicode characters properly
		const svg =
			typeof window !== 'undefined'
				? `data:image/svg+xml;base64,${btoa(encodeURIComponent(svgString).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))}`
				: `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

		return { svg, emoji: scheme.emoji, color: scheme.bg };
	}

	// Generate avatar on address change
	const avatarData = $derived(generateAvatar(address));
</script>

<div
	class="avatar avatar-{size}"
	class:rounded
	style="--size: {pixels}px"
	title={ensName || address}
>
	{#if ensImage}
		<img src={ensImage} {alt} class="avatar-image" />
	{:else if avatarData.svg}
		<img src={avatarData.svg} alt={alt || address} class="avatar-image" />
	{:else}
		<!-- Fallback: show emoji or abbreviated address -->
		<div class="avatar-fallback" style="background: {avatarData.color || '#A0AEC0'};">
			{avatarData.emoji || '👤'}
		</div>
	{/if}

	{#if showBadge && ensName}
		<div class="avatar-badge" title={ensName}>
			<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
				<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
			</svg>
		</div>
	{/if}
</div>

<style>
	.avatar {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--size);
		height: var(--size);
		background: var(--color-muted);
		border: 1px solid var(--color-border);
		user-select: none;
		flex-shrink: 0;
		/* Remove overflow: hidden to allow badge to extend outside */
	}

	.avatar.rounded {
		border-radius: var(--radius-full);
	}

	.avatar.rounded .avatar-image,
	.avatar.rounded .avatar-fallback {
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		background: var(--color-muted);
	}

	.spinner {
		width: calc(var(--size) * 0.4);
		height: calc(var(--size) * 0.4);
		border: 2px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: var(--radius-full);
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.avatar-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-size: calc(var(--size) * 0.5);
		color: var(--color-background);
		transition: transform 150ms ease;
	}

	.avatar-fallback:hover {
		transform: scale(1.1);
	}

	.avatar-badge {
		position: absolute;
		bottom: -4px;
		right: -4px;
		width: calc(var(--size) * 0.4);
		height: calc(var(--size) * 0.4);
		min-width: 16px;
		min-height: 16px;
		max-width: 26px;
		max-height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #10b981; /* Solid green for verified */
		color: white;
		border-radius: var(--radius-full);
		border: 2px solid var(--color-background);
		pointer-events: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
		z-index: 1;
	}

	.avatar-badge svg {
		width: 65%;
		height: 65%;
		color: white;
	}

	/* Size-specific badge adjustments */
	.avatar-xs .avatar-badge {
		display: none;
	}

	/* High contrast mode support */
	:global([data-contrast='high']) .avatar {
		border-width: 2px;
	}

	:global([data-contrast='ultra']) .avatar {
		border-width: 3px;
	}
</style>
