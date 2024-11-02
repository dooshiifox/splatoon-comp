export type Url = string;
export type AllLocations = Record<string, MapLocations>;
export type MapLocations = {
	name: string;
	id: number;
	gamemodes: {
		[gamemode in Gamemode]?: MapModeLocations;
	};
};
export const GAMEMODES = ["TW", "SZ", "TC", "RM", "CB"] as const;
export type Gamemode = (typeof GAMEMODES)[number];
export function isGamemode(t: unknown): t is Gamemode {
	// @ts-expect-error issue in Typescript typings
	return GAMEMODES.includes(t);
}

export type Transform = {
	rotation: number;
	scale: number;
	translate: {
		x: number;
		y: number;
	};
};

export type MapModeLocations = {
	minimap: Transform;
	locations: Array<Location>;
};
export type Location = {
	/** The horizontal center of the location on the image, as pixels from the
	 *  left of the image.
	 */
	x: number;
	/** The vertical center of the location on the image, as pixels from the
	 *  top of the image.
	 */
	y: number;
} & LocationTypes;
type LocationTypes = CalloutLocation;
export type CalloutLocation = {
	type: "callout";
	content: string;
};

export function getStageImage(stageId: number, gamemode: Gamemode, minimap: boolean) {
	return `https://raw.githubusercontent.com/Sendouc/sendou-ink-assets/refs/heads/main/planner-maps/${stageId}-${gamemode}-${minimap ? "MINI" : "OVER"}.png`;
}

export const CALLOUTS = {
	ScorchGorge: {
		name: "Scorch Gorge",
		id: 0,
		gamemodes: {
			RM: {
				locations: [
					{ type: "callout", x: 0, y: 0, content: "Top Mid" },
					{ type: "callout", x: -811, y: -304, content: "Spawn" },
					{ type: "callout", x: -669, y: -238, content: "Summit" },
					{ type: "callout", x: -558, y: -165, content: "Street" },
					{ type: "callout", x: -414, y: -288, content: "Cliff" },
					{ type: "callout", x: -369, y: -136, content: "Court" },
					{ type: "callout", x: -534, y: -46, content: "Bats" },
					{ type: "callout", x: -277, y: 18, content: "Plat" },
					{ type: "callout", x: -257, y: 99, content: "Drop" },
					{ type: "callout", x: -135, y: 46, content: "Right Mid" },
					{ type: "callout", x: -115, y: -15, content: "Bridge" },
					{ type: "callout", x: -183, y: -133, content: "Snipe" },
					{ type: "callout", x: -49, y: -190, content: "Ramp" },
					{ type: "callout", x: -120, y: -276, content: "Choke" },
					{ type: "callout", x: 85, y: -260, content: "Pit" },
					{ type: "callout", x: 140, y: -17, content: "Left Mid" }
				],
				minimap: {
					rotation: -60,
					scale: 0.65,
					translate: {
						x: 0,
						y: 0
					}
				}
			}
		}
	},
	EeltailAlley: {
		name: "Eeltail Alley",
		id: 1,
		gamemodes: {}
	},
	HagglefishMarket: {
		name: "Hagglefish Market",
		id: 2,
		gamemodes: {}
	},
	UndertowSpillway: {
		name: "Undertow Spillway",
		id: 3,
		gamemodes: {}
	},
	MincemeatMetalworks: {
		name: "Mincemeat Metalworks",
		id: 4,
		gamemodes: {}
	},
	HammerheadBridge: {
		name: "Hammerhead Bridge",
		id: 5,
		gamemodes: {}
	},
	MuseumDAlfonsino: {
		name: "Museum d'Alfonsino",
		id: 6,
		gamemodes: {
			RM: {
				minimap: {
					rotation: 0,
					scale: 1,
					translate: {
						x: 0,
						y: 0
					}
				},
				locations: []
			}
		}
	},
	MahiMahiResort: {
		name: "Mahi-Mahi Resort",
		id: 7,
		gamemodes: {}
	},
	InkblotArtAcademy: {
		name: "Inkblot Art Academy",
		id: 8,
		gamemodes: {}
	},
	SturgeonShipyard: {
		name: "Sturgeon Shipyard",
		id: 9,
		gamemodes: {}
	},
	MakoMart: {
		name: "MakoMart",
		id: 10,
		gamemodes: {}
	},
	WahooWorld: {
		name: "Wahoo World",
		id: 11,
		gamemodes: {}
	},
	FlounderHeights: {
		name: "Flounder Heights",
		id: 12,
		gamemodes: {}
	},
	BrinewaterSprings: {
		name: "Brinewater Springs",
		id: 13,
		gamemodes: {}
	},
	MantaMaria: {
		name: "Manta Maria",
		id: 14,
		gamemodes: {}
	},
	UmamiRuins: {
		name: "Um'ami Ruins",
		id: 15,
		gamemodes: {}
	},
	HumpbackPumpTrack: {
		name: "Humpback Pump Track",
		id: 16,
		gamemodes: {}
	},
	BarnacleAndDime: {
		name: "Barnacle & Dime",
		id: 17,
		gamemodes: {}
	},
	CrablegCapital: {
		name: "Crableg Capital",
		id: 18,
		gamemodes: {}
	},
	ShipshapeCargoCo: {
		name: "Shipshape Cargo Co.",
		id: 19,
		gamemodes: {}
	},
	BluefinDepot: {
		name: "Bluefin Depot",
		id: 20,
		gamemodes: {}
	},
	RoboRomEn: {
		name: "Robo ROM-en",
		id: 21,
		gamemodes: {}
	},
	MarlinAirport: {
		name: "Marlin Airport",
		id: 22,
		gamemodes: {}
	},
	LemuriaHub: {
		name: "Lemuria Hub",
		id: 23,
		gamemodes: {}
	}
} as const satisfies AllLocations;
export type MapName = keyof typeof CALLOUTS;
export function isMapName(t: unknown): t is MapName {
	return typeof t === "string" && t in CALLOUTS;
}
