import type { Topology, MultiPolygon } from 'topojson-specification';

export type Satellite = {
	name: string;
	period?: number;
	ownerCountry: string;
	owner: string;
	users: string;
	purpose: string;
	perigee: number;
	orbitClass: string;
	orbitType: string;
	launchDate: number;
	expectedLifetime?: number;
	contractor: string;
	contractorCountry: string;
	launchSite: string;
	ownerCountryCode: string;
};

export type MissionsByCountry = {
	country: string;
	countryCode: string;
	missions: number;
};

export type TimeSeries = {
	year: number;
	count: number;
};

export type SpaceMission = {
	company: string;
	date: number;
	location: string;
	mission: string;
	price: number;
	countryCode: string;
};

export type CountryProperties = { name: string; missions?: number };

export type WorldGeoJson = Topology<{
	countries1: {
		type: 'GeometryCollection';
		geometries: ({ properties: CountryProperties } & MultiPolygon)[];
	};
}>;
