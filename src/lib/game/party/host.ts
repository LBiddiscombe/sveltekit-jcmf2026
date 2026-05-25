import { browser } from '$app/environment';

const PARTY_NAME = 'room';
const DEV_PORT = 1999;

export function partyUrl(roomId: string): string {
	if (!browser) return '';
	const partykitHost = import.meta.env.PUBLIC_PARTYKIT_HOST as string | undefined;
	if (partykitHost) {
		return `wss://${partykitHost}/parties/${PARTY_NAME}/${roomId}`;
	}
	const host = window.location.hostname;
	if (window.location.protocol === 'http:') {
		return `ws://${host}:${DEV_PORT}/parties/${PARTY_NAME}/${roomId}`;
	}
	return `wss://${PARTY_NAME}.${host}/parties/${PARTY_NAME}/${roomId}`;
}
