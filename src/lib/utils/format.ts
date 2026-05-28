export function formatWeight(oz: number): string {
	const lb = Math.floor(oz / 16);
	const r = oz % 16;
	if (lb === 0) return `${oz} oz`;
	if (r === 0) return `${lb} lb`;
	return `${lb} lb ${r} oz`;
}

export function formatShortDuration(totalSec: number): string {
	if (totalSec <= 0) return '0s';
	const m = Math.floor(totalSec / 60);
	const s = Math.floor(totalSec % 60);
	if (m === 0) return `${s}s`;
	if (s === 0) return `${m}m`;
	return `${m}m ${s}s`;
}
