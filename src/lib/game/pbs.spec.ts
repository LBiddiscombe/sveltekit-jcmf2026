import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkIsPB, recordPB, clearPBs, getPBs } from './pbs';

describe('PBs', () => {
	const store = new Map<string, string>();

	beforeEach(() => {
		store.clear();
		vi.stubGlobal('localStorage', {
			getItem: vi.fn((key: string) => store.get(key) ?? null),
			setItem: vi.fn((key: string, value: string) => store.set(key, value)),
			removeItem: vi.fn((key: string) => store.delete(key))
		});
	});

	describe('getPBs', () => {
		it('returns empty object when no PBs stored', () => {
			expect(getPBs()).toEqual({});
		});

		it('returns empty object on corrupt JSON', () => {
			store.set('jcmf-pbs', 'not-json');
			expect(getPBs()).toEqual({});
		});
	});

	describe('checkIsPB', () => {
		it("returns 'pb' when no existing PB for species", () => {
			expect(checkIsPB('Roach', 12, 68)).toBe('pb');
		});

		it("returns 'record' when weight >= species record", () => {
			expect(checkIsPB('Roach', 68, 68)).toBe('record');
		});

		it("returns 'record' when weight exceeds species record", () => {
			expect(checkIsPB('Roach', 100, 68)).toBe('record');
		});

		it('returns null when weight <= existing PB', () => {
			recordPB('Roach', 20);
			expect(checkIsPB('Roach', 20, 68)).toBe(null);
			expect(checkIsPB('Roach', 15, 68)).toBe(null);
		});

		it("returns 'pb' when weight exceeds existing PB but is below record", () => {
			recordPB('Roach', 10);
			expect(checkIsPB('Roach', 20, 68)).toBe('pb');
		});
	});

	describe('recordPB', () => {
		it('persists a PB entry', () => {
			recordPB('Roach', 30);
			const pbs = getPBs();
			expect(pbs.Roach).toBeDefined();
			expect(pbs.Roach.weightOz).toBe(30);
			expect(pbs.Roach.species).toBe('Roach');
			expect(pbs.Roach.achievedAt).toBeGreaterThan(0);
		});

		it('overwrites an existing PB for the same species', () => {
			recordPB('Roach', 30);
			recordPB('Roach', 45);
			const pbs = getPBs();
			expect(pbs.Roach.weightOz).toBe(45);
		});
	});

	describe('clearPBs', () => {
		it('removes all PB data', () => {
			recordPB('Roach', 30);
			recordPB('Perch', 20);
			clearPBs();
			expect(getPBs()).toEqual({});
		});
	});
});
