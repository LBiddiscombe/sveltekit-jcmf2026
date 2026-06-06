import { browser } from '$app/environment';
import type { FishData } from './population';
import type { FishingLoopSaveData } from './loop';
import type { BotControllerSaveData } from './bot-controller';
import type { MatchRules } from './match-rules';
import type { AnglerState } from './prep-state.svelte';

const STORAGE_KEY = 'jcmf-saved-match';

export type SavedFishingLoop = FishingLoopSaveData;
export type SavedBotController = BotControllerSaveData;

interface CatchAuditEntry {
	caughtAtMs: number;
	anglerId: string;
	anglerName: string;
	species: string;
	classificationLabel: string;
	weightOz: number;
}

export interface SavedMatchData {
	version: 1;
	venueName: string;
	lakeName: string;
	playerPeg: string;
	matchRules: MatchRules;
	timeLimitMinutes: number;
	matchStartTime: number;
	anglers: AnglerState[];
	catchAudit: CatchAuditEntry[];
	sessionStartMs: number;
	initialTackleChosen: boolean;
	timerRemainingSeconds: number;
	timerExpired: boolean;
	weighInEarlyActive: boolean;
	pegPopulations: Record<string, FishData[]>;
	playerLoop: SavedFishingLoop | null;
	botControllers: Record<string, SavedBotController>;
	botCaughtIndex: Record<string, number>;
}

export function saveMatch(data: SavedMatchData): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		// localStorage may be full or unavailable
	}
}

export function loadMatch(): SavedMatchData | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as SavedMatchData;
		if (data.version !== 1) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}
		return data;
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		return null;
	}
}

export function clearSavedMatch(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}

export function hasSavedMatch(): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem(STORAGE_KEY) !== null;
	} catch {
		return false;
	}
}
