let sentinel: WakeLockSentinel | null = null;
export const wakeLock = $state({ active: false });

export function startWakeLock(): void {
	document.addEventListener('visibilitychange', onVisibilityChange);
}

export async function acquireWakeLock(): Promise<void> {
	if (!('wakeLock' in navigator)) return;
	try {
		sentinel?.release();
		sentinel = await navigator.wakeLock.request('screen');
		wakeLock.active = true;
		sentinel.addEventListener('release', () => {
			sentinel = null;
			wakeLock.active = false;
		});
	} catch {
		// silently fail — e.g. battery saver mode, PWA on iOS, temporary denial
	}
}

export function stopWakeLock(): void {
	document.removeEventListener('visibilitychange', onVisibilityChange);
	sentinel?.release();
	sentinel = null;
	wakeLock.active = false;
}

function onVisibilityChange(): void {
	if (document.visibilityState === 'visible' && wakeLock.active && sentinel === null) {
		acquireWakeLock();
	}
}
