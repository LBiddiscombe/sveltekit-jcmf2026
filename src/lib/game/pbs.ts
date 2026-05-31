const STORAGE_KEY = 'jcmf-pbs';

export interface PBEntry {
	weightOz: number;
	species: string;
	achievedAt: number;
}

function getPBs(): Record<string, PBEntry> {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
	} catch {
		return {};
	}
}

export function checkIsPB(
	species: string,
	weightOz: number,
	recordWeight: number
): 'pb' | 'record' | null {
	const pbs = getPBs();
	const current = pbs[species];
	if (current && weightOz <= current.weightOz) return null;
	if (weightOz >= recordWeight) return 'record';
	return 'pb';
}

export function recordPB(species: string, weightOz: number): void {
	const pbs = getPBs();
	pbs[species] = { weightOz, species, achievedAt: Date.now() };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(pbs));
}
