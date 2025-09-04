/**
 * 简单的二维码生成器
 * 使用内联 SVG 生成二维码，避免外部依赖
 */

interface QRCodeOptions {
	width?: number;
	height?: number;
	margin?: number;
	color?: string;
	background?: string;
}

/**
 * 生成二维码 SVG
 * 这是一个简化版本，用于生成 WalletConnect URI 的二维码
 */
export function generateQRCode(text: string, options: QRCodeOptions = {}): string {
	const { width = 280, margin = 4, color = '#000000', background = '#FFFFFF' } = options;

	// 使用简化的 QR 码生成算法
	// 实际生产环境建议使用 qrcode 库
	const modules = generateQRModules(text);
	const size = modules.length;
	const cellSize = Math.floor((width - margin * 2) / size);
	const actualSize = cellSize * size + margin * 2;

	let svg = `<svg width="${actualSize}" height="${actualSize}" viewBox="0 0 ${actualSize} ${actualSize}" xmlns="http://www.w3.org/2000/svg">`;
	svg += `<rect width="${actualSize}" height="${actualSize}" fill="${background}"/>`;
	svg += `<g fill="${color}">`;

	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (modules[row][col]) {
				const x = col * cellSize + margin;
				const y = row * cellSize + margin;
				svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"/>`;
			}
		}
	}

	svg += '</g>';
	svg += '</svg>';

	return svg;
}

/**
 * 简化的 QR 码模块生成函数
 * 注意：这是一个极简的实现，仅用于演示
 * 实际使用时应该使用完整的 QR 码生成算法
 */
function generateQRModules(text: string): boolean[][] {
	// 为了演示，这里返回一个固定的 21x21 模式
	// 实际应该根据 text 生成正确的 QR 码矩阵
	const size = 21;
	const modules: boolean[][] = Array(size)
		.fill(null)
		.map(() => Array(size).fill(false));

	// 添加定位图案（左上、右上、左下）
	const addFinderPattern = (row: number, col: number) => {
		for (let r = 0; r < 7; r++) {
			for (let c = 0; c < 7; c++) {
				if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
					modules[row + r][col + c] = true;
				}
			}
		}
	};

	addFinderPattern(0, 0);
	addFinderPattern(0, size - 7);
	addFinderPattern(size - 7, 0);

	// 添加定时图案
	for (let i = 8; i < size - 8; i += 2) {
		modules[6][i] = true;
		modules[i][6] = true;
	}

	// 基于文本生成简单的数据区域图案
	// 这只是演示，不是真正的 QR 码编码
	const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	for (let r = 8; r < size - 8; r++) {
		for (let c = 8; c < size - 8; c++) {
			if (c !== 6 && r !== 6) {
				modules[r][c] = (hash * r * c) % 3 === 0;
			}
		}
	}

	return modules;
}

/**
 * 使用外部 API 生成 QR 码（备选方案）
 * @param text - 要编码的文本
 * @param size - QR 码大小
 * @param darkMode - 是否为暗色模式
 */
export function generateQRCodeDataURL(
	text: string,
	size: number = 280,
	darkMode: boolean = false
): string {
	// 使用公开的 QR 码生成 API
	const encodedText = encodeURIComponent(text);

	// 暗色模式：白底黑码，亮色模式：白底黑码（QR 码标准）
	// 但可以通过调整容器背景来适配
	const color = darkMode ? '000000' : '000000'; // QR 码颜色
	const bgcolor = darkMode ? 'ffffff' : 'ffffff'; // 背景颜色

	return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&color=${color}&bgcolor=${bgcolor}`;
}
