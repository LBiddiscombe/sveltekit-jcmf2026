import { browser } from '$app/environment';
import { PUBLIC_PARTYKIT_HOST } from '$env/static/public';

const PARTY_NAME = 'room';
const DEV_PORT = 1999;

export function partyUrl(roomId: string): string {
	if (!browser) return '';
	if (PUBLIC_PARTYKIT_HOST) {
		return `wss://${PUBLIC_PARTYKIT_HOST}/parties/${PARTY_NAME}/${roomId}`;
	}
	const host = window.location.hostname;
	if (window.location.protocol === 'http:') {
		return `ws://${host}:${DEV_PORT}/parties/${PARTY_NAME}/${roomId}`;
	}
	return `wss://${PARTY_NAME}.${host}/parties/${PARTY_NAME}/${roomId}`;
}
