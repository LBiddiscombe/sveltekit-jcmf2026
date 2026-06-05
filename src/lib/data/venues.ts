import type { Venue } from './types';

export const venues: Venue[] = [
	{
		name: 'JCs',
		image: 'jcs.jpeg',
		lakes: [
			{
				name: 'Match Lake',
				image: 'jcs-match.jpeg',
				fishPerPeg: 500,
				species: [
					{ name: 'Barbel', frequency: 4 },
					{ name: 'Bream', frequency: 5 },
					{ name: 'Carp', frequency: 5 },
					{ name: 'Chub', frequency: 5 },
					{ name: 'Crucian', frequency: 4 },
					{ name: 'Dace', frequency: 8 },
					{ name: 'Eel', frequency: 1 },
					{ name: 'Grayling', frequency: 3 },
					{ name: 'Perch', frequency: 8 },
					{ name: 'Pike', frequency: 3 },
					{ name: 'Roach', frequency: 10 },
					{ name: 'Rudd', frequency: 7 },
					{ name: 'Tench', frequency: 4 }
				],
				pegs: [
					{
						name: '1',
						description:
							'This is a sheltered swim, hidden in a cove. The sides of the bank are steep, leading to deep water close to shore. There are weed beds just visible below the surface.',
						image: 'jcs-match-1.jpeg',
						features: { flow: 0.1, clarity: 0.8, substrate: 0.2, vegetation: 0.7, shelter: 0.9 }
					},
					{
						name: '2',
						description:
							'You are on a small piece of land jutting out into the lake. To your right there are a lot of lily pads, and weed beds. The rest of your swim is clear and the depth increases gradually from the stoney bank.',
						image: 'jcs-match-2.jpeg',
						features: { flow: 0.1, clarity: 0.8, substrate: 0.8, vegetation: 0.7, shelter: 0.5 }
					},
					{
						name: '3',
						description:
							'This peg has a very shallow sloping bank, but the slope of the bank increases at the water line. There are a few large lily pads directly in front of you, and more lily pads and reeds to your left. The depth at 15ft out is about 7ft. The bank consists mainly of mud and the water is a little cloudy.',
						image: 'jcs-match-3.jpeg',
						features: { flow: 0.1, clarity: 0.3, substrate: 0.2, vegetation: 0.7, shelter: 0.5 }
					},
					{
						name: '4',
						description:
							'You have an open swim with little reed or weed cover. The bank is muddy and the water is very cloudy. There is an island directly in front of you, with a lot of weed cover around it. The maximum depth is about 6 ft.',
						image: 'jcs-match-4.jpeg',
						features: { flow: 0.1, clarity: 0.3, substrate: 0.2, vegetation: 0.7, shelter: 0.5 }
					},
					{
						name: '5',
						description:
							"There is an acute bank leading to a shallow sloping bank at the water's edge. The mouth of a small river is to your right, and in front of you is an island. There are visible signs of weedbeds and the water is clear but a little choppy.",
						image: 'jcs-match-5.jpeg',
						features: { flow: 0.5, clarity: 0.8, substrate: 0.8, vegetation: 0.7, shelter: 0.6 }
					},
					{
						name: '6',
						description:
							'You are located at the mouth of a river. The water is slow running and murky, and contains a lot of organic debris. The maximum depth is 8 ft. Directly behind you there is a large tree.',
						image: 'jcs-match-6.jpeg',
						features: { flow: 0.3, clarity: 0.3, substrate: 0.2, vegetation: 0.7, shelter: 0.6 }
					},
					{
						name: '7',
						description:
							'You are located between two large trees, and consequently there are a lot of leaves and twigs in the water, and on the lake. The maximum depth is 7ft; 20 ft out.',
						image: 'jcs-match-7.jpeg',
						features: { flow: 0.1, clarity: 0.3, substrate: 0.2, vegetation: 0.7, shelter: 0.7 }
					},
					{
						name: '8',
						description:
							'The water is deep at the edge and remains constant in your swim, there are weeds and reeds to you left, and a cove to your right. Straight ahead is a small piece of land jutting out into the lake.',
						image: 'jcs-match-8.jpeg',
						features: { flow: 0.1, clarity: 0.8, substrate: 0.2, vegetation: 0.7, shelter: 0.8 }
					}
				]
			}
		]
	}
];
