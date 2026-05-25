export type GameMode = 'session' | 'match' | 'multiplayer';

export function modeFromSearchParams(searchParams: URLSearchParams): GameMode {
	return searchParams.get('mode') === 'match' ? 'match' : 'session';
}

export function prepLakeUrl(mode: GameMode): string {
	return `/prep/lake?mode=${mode}`;
}

export function gameReturnToPath(): string {
	return '/game';
}

export function tackleFromGameUrl(): string {
	const params = new URLSearchParams();
	params.set('returnTo', gameReturnToPath());
	return `/prep/tackle?${params.toString()}`;
}

export function prepRulesUrl(): string {
	return '/prep/rules';
}

export function prepDrawUrl(): string {
	return '/prep/draw';
}

export function prepTackleUrl(returnTo?: string): string {
	if (!returnTo) return '/prep/tackle';
	const params = new URLSearchParams();
	params.set('returnTo', returnTo);
	return `/prep/tackle?${params.toString()}`;
}
