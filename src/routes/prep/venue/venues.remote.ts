import { query } from '$app/server';
import { venues } from '$lib/data';

export const getVenues = query(async () => {
	return venues.map((v) => ({
		name: v.name,
		image: v.image,
		lakeCount: v.lakes.length
	}));
});
