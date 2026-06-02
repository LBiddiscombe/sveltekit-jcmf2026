import { describe, it, expect } from 'vitest';
import { formatWeight, formatShortDuration } from './format';

describe('formatWeight', () => {
	it('returns oz only for weights under 1 lb', () => {
		expect(formatWeight(0)).toBe('0 oz');
		expect(formatWeight(1)).toBe('1 oz');
		expect(formatWeight(15)).toBe('15 oz');
	});

	it('returns lb only for exact pounds', () => {
		expect(formatWeight(16)).toBe('1 lb');
		expect(formatWeight(32)).toBe('2 lb');
		expect(formatWeight(160)).toBe('10 lb');
	});

	it('returns lb and oz for mixed weights', () => {
		expect(formatWeight(20)).toBe('1 lb 4 oz');
		expect(formatWeight(30)).toBe('1 lb 14 oz');
		expect(formatWeight(34)).toBe('2 lb 2 oz');
	});
});

describe('formatShortDuration', () => {
	it('returns 00m 00s for zero or negative', () => {
		expect(formatShortDuration(0)).toBe('00m 00s');
		expect(formatShortDuration(-5)).toBe('00m 00s');
	});

	it('returns zero-padded MMm SSs', () => {
		expect(formatShortDuration(1)).toBe('00m 01s');
		expect(formatShortDuration(30)).toBe('00m 30s');
		expect(formatShortDuration(59)).toBe('00m 59s');
		expect(formatShortDuration(60)).toBe('01m 00s');
		expect(formatShortDuration(120)).toBe('02m 00s');
		expect(formatShortDuration(600)).toBe('10m 00s');
		expect(formatShortDuration(61)).toBe('01m 01s');
		expect(formatShortDuration(90)).toBe('01m 30s');
		expect(formatShortDuration(150)).toBe('02m 30s');
		expect(formatShortDuration(3665)).toBe('61m 05s');
	});
});
