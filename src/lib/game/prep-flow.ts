export type GameMode = 'session' | 'match' | 'multiplayer';

export function modeFromSearchParams(searchParams: URLSearchParams): GameMode {
	return searchParams.get('mode') === 'match' ? 'match' : 'session';
}

export function prepLakeUrl(mode: GameMode): string {
	return `/prep/lake?mode=${mode}`;
}

export function prepRulesUrl(): string {
	return '/prep/rules';
}

export function prepDrawUrl(): string {
	return '/prep/draw';
}
