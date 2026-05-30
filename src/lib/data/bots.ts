export interface BotAngler {
	name: string;
	skill: number;
	image: string;
}

function randomSkill(): number {
	return Math.floor(Math.random() * 10) + 1;
}

export const bots: BotAngler[] = [
	{ name: 'Aaron', skill: randomSkill(), image: 'aaron.jpeg' },
	{ name: 'Alan', skill: 10, image: 'alan.jpeg' },
	{ name: 'Ashley', skill: randomSkill(), image: 'ashley.jpeg' },
	{ name: 'Becky', skill: randomSkill(), image: 'becky.jpeg' },
	{ name: 'Bob', skill: randomSkill(), image: 'bob.jpeg' },
	{ name: 'Dylan', skill: 10, image: 'dylan.jpeg' },
	{ name: 'Emma', skill: randomSkill(), image: 'emma.jpeg' },
	{ name: 'Eric', skill: randomSkill(), image: 'eric.jpeg' },
	{ name: 'Jack', skill: randomSkill(), image: 'jack.jpeg' },
	{ name: 'John', skill: randomSkill(), image: 'john.jpeg' },
	{ name: 'Katie', skill: 10, image: 'katie.jpeg' },
	{ name: 'Lee', skill: 10, image: 'lee.jpeg' },
	{ name: 'Lou', skill: randomSkill(), image: 'lou.jpeg' },
	{ name: 'Matt', skill: randomSkill(), image: 'matt.jpeg' },
	{ name: 'Mick', skill: randomSkill(), image: 'mick.jpeg' },
	{ name: 'Mya', skill: 10, image: 'mya.jpeg' },
	{ name: 'Nick', skill: 10, image: 'nick.jpeg' },
	{ name: 'Paul', skill: randomSkill(), image: 'paul.jpeg' },
	{ name: 'Sam', skill: randomSkill(), image: 'sam.jpeg' },
	{ name: 'Sarah', skill: randomSkill(), image: 'sarah.jpeg' },
	{ name: 'Sophie', skill: 10, image: 'sophie.jpeg' }
];
