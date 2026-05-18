import { query } from '$app/server';
import { venues } from '$lib/data';

export const getLakes = query('unchecked' as const, async ({ venue }: { venue: string }) => {
	const v = venues.find((v) => v.name === venue);
	if (!v) throw new Error(`Venue not found: ${venue}`);
	return {
		venue: { name: v.name, image: v.image },
		lakes: v.lakes.map((l) => ({
			name: l.name,
			image: l.image ?? null,
			pegCount: l.pegs.length,
			speciesCount: l.species.length
		}))
	};
});
