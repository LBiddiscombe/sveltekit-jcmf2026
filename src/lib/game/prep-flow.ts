export type GameMode = 'session' | 'match';

export function modeFromSearchParams(searchParams: URLSearchParams): GameMode {
	return searchParams.get('mode') === 'match' ? 'match' : 'session';
}

export function prepVenueUrl(mode: GameMode): string {
	return `/prep/venue?mode=${mode}`;
}

export function gameReturnToPath(): string {
	return '/game';
}

export function tackleFromGameUrl(): string {
	const params = new URLSearchParams();
	params.set('returnTo', gameReturnToPath());
	return `/prep/tackle?${params.toString()}`;
}
