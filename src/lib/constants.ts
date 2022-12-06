export const OrbitCategories = {
	purpose: [
		'Communications',
		'Earth Observation',
		'Navigation',
		'Space Science',
		'Technology Development',
		'Other'
	],
	orbitClass: ['LEO', 'MEO', 'GEO', 'HEO', 'Elliptical', 'Other'],
	users: ['Commercial', 'Civil', 'Government', 'Military', 'Other']
};

export const FPS = 60;

export const timeline: { name: string; year: number }[] = [
	{
		name: 'First photograph of Earth from space',
		year: 1959
	},
	{
		name: 'First human spaceflight',
		year: 1961
	},
	{
		name: 'First human on the moon',
		year: 1969
	},
	{
		name: 'End of the space race',
		year: 1975
	},
	{
		name: 'Collapse of the USSR',
		year: 1991
	},
	{
		name: 'First multinational space station',
		year: 1998
	},
	{
		name: 'SpaceX launches first commercial spacecraft',
		year: 2008
	},
	{
		name: 'SpaceX performs first landing of an orbital rocket',
		year: 2015
	},
	{
		name: 'SpaceX begins launching Starlink megaconstellation',
		year: 2019
	}
];
