export type Url = string;
export type AllLocations = Record<string, MapLocations>;
export type MapLocations = {
	name: string;
	alias: Array<string>;
	id: number;
	minimap: Transform;
	gamemodes: {
		[gamemode in Gamemode]: Array<Location>;
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

export const LOCATIONS = {
	ScorchGorge: {
		name: "Scorch Gorge",
		alias: ["Scorch", "Gorge", "SG", "SCG"],
		id: 0,
		minimap: {
			rotation: -60,
			scale: 0.65,
			translate: {
				x: 0,
				y: 0
			}
		},
		gamemodes: {
			TW: [
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
				{ type: "callout", x: -183, y: -133, content: "Snipe" },
				{ type: "callout", x: -120, y: -276, content: "Choke" },
				{ type: "callout", x: 85, y: -260, content: "Pit" },
				{ type: "callout", x: 140, y: -17, content: "Left Mid" },
				{ type: "callout", x: -45, y: -113, content: "Grates" }
			],
			SZ: [
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
				{ type: "callout", x: -183, y: -133, content: "Snipe" },
				{ type: "callout", x: -120, y: -276, content: "Choke" },
				{ type: "callout", x: 85, y: -260, content: "Pit" },
				{ type: "callout", x: 140, y: -17, content: "Left Mid" },
				{ type: "callout", x: -45, y: -113, content: "Grates" }
			],
			TC: [
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
				{ type: "callout", x: -183, y: -133, content: "Snipe" },
				{ type: "callout", x: -49, y: -190, content: "Ramp" },
				{ type: "callout", x: -120, y: -276, content: "Choke" },
				{ type: "callout", x: 85, y: -260, content: "Pit" },
				{ type: "callout", x: 140, y: -17, content: "Left Mid" }
			],
			RM: [
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
			CB: [
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
			]
		}
	},
	EeltailAlley: {
		name: "Eeltail Alley",
		alias: ["Eeltail", "Alley", "EA", "ETA"],
		id: 1,
		minimap: {
			rotation: -40,
			scale: 0.59,
			translate: {
				x: 20,
				y: 20
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -593, y: 84, content: "Plat" },
				{ type: "callout", x: -1, y: -1, content: "Mid" },
				{ type: "callout", x: -118, y: 64, content: "Snipe" },
				{ type: "callout", x: -131, y: 116, content: "Pocket" },
				{ type: "callout", x: -137, y: -138, content: "Drop" },
				{ type: "callout", x: -190, y: -207, content: "Perch" },
				{ type: "callout", x: -322, y: -184, content: "Booth" },
				{ type: "callout", x: -543, y: -188, content: "Grate" },
				{ type: "callout", x: -710, y: -88, content: "Cat" },
				{ type: "callout", x: -747, y: 85, content: "Spawn" },
				{ type: "callout", x: -417, y: 81, content: "Beams / Glass" },
				{ type: "callout", x: -403, y: 198, content: "Roof" },
				{ type: "callout", x: -266, y: 139, content: "Bunker" },
				{ type: "callout", x: -305, y: 22, content: "Ramp" },
				{ type: "callout", x: -197, y: -39, content: "Bridge" },
				{ type: "callout", x: -370, y: -61, content: "Court" }
			],
			SZ: [
				{ type: "callout", x: -593, y: 84, content: "Plat" },
				{ type: "callout", x: -1, y: -1, content: "Mid" },
				{ type: "callout", x: -118, y: 64, content: "Snipe" },
				{ type: "callout", x: -131, y: 116, content: "Pocket" },
				{ type: "callout", x: -137, y: -138, content: "Drop" },
				{ type: "callout", x: -190, y: -207, content: "Perch" },
				{ type: "callout", x: -322, y: -184, content: "Booth" },
				{ type: "callout", x: -543, y: -188, content: "Grate" },
				{ type: "callout", x: -710, y: -88, content: "Cat" },
				{ type: "callout", x: -747, y: 85, content: "Spawn" },
				{ type: "callout", x: -417, y: 81, content: "Beams / Glass" },
				{ type: "callout", x: -403, y: 198, content: "Roof" },
				{ type: "callout", x: -266, y: 139, content: "Bunker" },
				{ type: "callout", x: -305, y: 22, content: "Ramp" },
				{ type: "callout", x: -197, y: -39, content: "Bridge" },
				{ type: "callout", x: -370, y: -61, content: "Court" }
			],
			TC: [
				{ type: "callout", x: -593, y: 84, content: "Plat" },
				{ type: "callout", x: -1, y: -1, content: "Mid" },
				{ type: "callout", x: -118, y: 64, content: "Snipe" },
				{ type: "callout", x: -131, y: 116, content: "Pocket" },
				{ type: "callout", x: -190, y: -207, content: "Perch" },
				{ type: "callout", x: -322, y: -184, content: "Booth" },
				{ type: "callout", x: -543, y: -188, content: "Grate" },
				{ type: "callout", x: -710, y: -88, content: "Cat" },
				{ type: "callout", x: -747, y: 85, content: "Spawn" },
				{ type: "callout", x: -417, y: 81, content: "Beams / Glass" },
				{ type: "callout", x: -403, y: 198, content: "Roof" },
				{ type: "callout", x: -266, y: 139, content: "Bunker" },
				{ type: "callout", x: -305, y: 22, content: "Ramp" },
				{ type: "callout", x: -370, y: -61, content: "Court" }
			],
			RM: [
				{ type: "callout", x: -593, y: 84, content: "Plat" },
				{ type: "callout", x: -1, y: -1, content: "Mid" },
				{ type: "callout", x: -118, y: 64, content: "Snipe" },
				{ type: "callout", x: -131, y: 116, content: "Pocket" },
				{ type: "callout", x: -190, y: -207, content: "Perch" },
				{ type: "callout", x: -322, y: -184, content: "Booth" },
				{ type: "callout", x: -543, y: -188, content: "Grate" },
				{ type: "callout", x: -710, y: -88, content: "Cat" },
				{ type: "callout", x: -747, y: 85, content: "Spawn" },
				{ type: "callout", x: -417, y: 81, content: "Beams / Glass" },
				{ type: "callout", x: -403, y: 198, content: "Roof" },
				{ type: "callout", x: -266, y: 139, content: "Bunker" },
				{ type: "callout", x: -305, y: 22, content: "Ramp" },
				{ type: "callout", x: -197, y: -39, content: "Bridge" },
				{ type: "callout", x: -370, y: -61, content: "Court" }
			],
			CB: [
				{ type: "callout", x: -593, y: 84, content: "Plat" },
				{ type: "callout", x: -1, y: -1, content: "Mid" },
				{ type: "callout", x: -118, y: 64, content: "Snipe" },
				{ type: "callout", x: -131, y: 116, content: "Pocket" },
				{ type: "callout", x: -137, y: -138, content: "Drop" },
				{ type: "callout", x: -190, y: -207, content: "Perch" },
				{ type: "callout", x: -322, y: -184, content: "Booth" },
				{ type: "callout", x: -543, y: -188, content: "Grate" },
				{ type: "callout", x: -710, y: -88, content: "Cat" },
				{ type: "callout", x: -747, y: 85, content: "Spawn" },
				{ type: "callout", x: -417, y: 81, content: "Beams / Glass" },
				{ type: "callout", x: -403, y: 198, content: "Roof" },
				{ type: "callout", x: -266, y: 139, content: "Bunker" },
				{ type: "callout", x: -305, y: 22, content: "Ramp" },
				{ type: "callout", x: -197, y: -39, content: "Bridge" },
				{ type: "callout", x: -370, y: -61, content: "Court" }
			]
		}
	},
	HagglefishMarket: {
		name: "Hagglefish Market",
		alias: ["Hagglefish", "Market", "HM", "HFM"],
		id: 2,
		minimap: {
			rotation: -25,
			scale: 0.7,
			translate: {
				x: -20,
				y: 20
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -2, y: -1, content: "Mid" },
				{ type: "callout", x: 25, y: 168, content: "Alley" },
				{ type: "callout", x: -219, y: -170, content: "Drop" },
				{ type: "callout", x: -341, y: -127, content: "Switch" },
				{ type: "callout", x: -492, y: -221, content: "Elbow" },
				{ type: "callout", x: -238, y: 95, content: "Glass /\nTent" },
				{ type: "callout", x: -255, y: 196, content: "Pit" },
				{ type: "callout", x: -248, y: -12, content: "Court" },
				{ type: "callout", x: -446, y: 57, content: "Plat" },
				{ type: "callout", x: -501, y: -41, content: "Grate" },
				{ type: "callout", x: -789, y: 38, content: "Spawn" },
				{ type: "callout", x: -603, y: 293, content: "Roof" },
				{ type: "callout", x: -444, y: 240, content: "Sneaky" }
			],
			SZ: [
				{ type: "callout", x: -2, y: -1, content: "Mid" },
				{ type: "callout", x: 25, y: 168, content: "Alley" },
				{ type: "callout", x: -219, y: -170, content: "Drop" },
				{ type: "callout", x: -341, y: -127, content: "Switch" },
				{ type: "callout", x: -492, y: -221, content: "Elbow" },
				{ type: "callout", x: -238, y: 95, content: "Glass /\nTent" },
				{ type: "callout", x: -255, y: 196, content: "Pit" },
				{ type: "callout", x: -248, y: -12, content: "Court" },
				{ type: "callout", x: -446, y: 57, content: "Plat" },
				{ type: "callout", x: -501, y: -41, content: "Grate" },
				{ type: "callout", x: -789, y: 38, content: "Spawn" },
				{ type: "callout", x: -603, y: 293, content: "Roof" },
				{ type: "callout", x: -444, y: 240, content: "Sneaky" }
			],
			TC: [
				{ type: "callout", x: -2, y: -1, content: "Mid" },
				{ type: "callout", x: 25, y: 168, content: "Alley" },
				{ type: "callout", x: -219, y: -170, content: "Drop" },
				{ type: "callout", x: -341, y: -127, content: "Switch" },
				{ type: "callout", x: -492, y: -221, content: "Elbow" },
				{ type: "callout", x: -238, y: 95, content: "Glass /\nTent" },
				{ type: "callout", x: -255, y: 196, content: "Pit" },
				{ type: "callout", x: -248, y: -12, content: "Court" },
				{ type: "callout", x: -446, y: 57, content: "Plat" },
				{ type: "callout", x: -501, y: -41, content: "Grate" },
				{ type: "callout", x: -789, y: 38, content: "Spawn" },
				{ type: "callout", x: -603, y: 293, content: "Roof" },
				{ type: "callout", x: -444, y: 240, content: "Sneaky" }
			],
			RM: [
				{ type: "callout", x: -2, y: -1, content: "Mid" },
				{ type: "callout", x: 25, y: 168, content: "Alley" },
				{ type: "callout", x: -219, y: -170, content: "Drop" },
				{ type: "callout", x: -341, y: -127, content: "Switch" },
				{ type: "callout", x: -492, y: -221, content: "Elbow" },
				{ type: "callout", x: -238, y: 95, content: "Glass /\nTent" },
				{ type: "callout", x: -255, y: 196, content: "Pit" },
				{ type: "callout", x: -248, y: -12, content: "Court" },
				{ type: "callout", x: -446, y: 57, content: "Plat" },
				{ type: "callout", x: -501, y: -41, content: "Grate" },
				{ type: "callout", x: -789, y: 38, content: "Spawn" },
				{ type: "callout", x: -603, y: 293, content: "Roof" },
				{ type: "callout", x: -444, y: 240, content: "Sneaky" }
			],
			CB: [
				{ type: "callout", x: -2, y: -1, content: "Mid" },
				{ type: "callout", x: 25, y: 168, content: "Alley" },
				{ type: "callout", x: -219, y: -170, content: "Drop" },
				{ type: "callout", x: -341, y: -127, content: "Switch" },
				{ type: "callout", x: -492, y: -221, content: "Elbow" },
				{ type: "callout", x: -238, y: 95, content: "Glass /\nTent" },
				{ type: "callout", x: -255, y: 196, content: "Pit" },
				{ type: "callout", x: -248, y: -12, content: "Court" },
				{ type: "callout", x: -446, y: 57, content: "Plat" },
				{ type: "callout", x: -789, y: 38, content: "Spawn" },
				{ type: "callout", x: -603, y: 293, content: "Roof" },
				{ type: "callout", x: -444, y: 240, content: "Sneaky" }
			]
		}
	},
	UndertowSpillway: {
		name: "Undertow Spillway",
		alias: ["Undertow", "Spillway", "UT", "UTS"],
		id: 3,
		minimap: {
			rotation: -45,
			scale: 0.55,
			translate: {
				x: 0,
				y: 25
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -704, y: -306, content: "Spawn" },
				{ type: "callout", x: -584, y: -81, content: "Plat" },
				{ type: "callout", x: -279, y: -116, content: "Court" },
				{ type: "callout", x: -100, y: -263, content: "Snipe" },
				{ type: "callout", x: 30, y: -154, content: "Tunnel" },
				{ type: "callout", x: -41, y: -107, content: "Glass" },
				{ type: "callout", x: -3, y: 7, content: "Mid" },
				{ type: "callout", x: -209, y: 154, content: "Grass" },
				{ type: "callout", x: -282, y: 1, content: "Spine" },
				{ type: "callout", x: -449, y: -50, content: "Sponge" },
				{ type: "callout", x: -550, y: -4, content: "Perch" },
				{ type: "callout", x: -345, y: 185, content: "Ring" },
				{ type: "callout", x: -118, y: 282, content: "Pit" },
				{ type: "callout", x: -793, y: 52, content: "Bats" },
				{ type: "callout", x: -457, y: -247, content: "Ramp" },
				{ type: "callout", x: -357, y: -321, content: "Grate" }
			],
			SZ: [
				{ type: "callout", x: -704, y: -306, content: "Spawn" },
				{ type: "callout", x: -584, y: -81, content: "Plat" },
				{ type: "callout", x: -279, y: -116, content: "Court" },
				{ type: "callout", x: -100, y: -263, content: "Snipe" },
				{ type: "callout", x: 30, y: -154, content: "Tunnel" },
				{ type: "callout", x: -41, y: -107, content: "Glass" },
				{ type: "callout", x: -28, y: -55, content: "Zone" },
				{ type: "callout", x: -3, y: 7, content: "Mid" },
				{ type: "callout", x: -209, y: 154, content: "Grass" },
				{ type: "callout", x: -282, y: 1, content: "Spine" },
				{ type: "callout", x: -449, y: -50, content: "Sponge" },
				{ type: "callout", x: -550, y: -4, content: "Perch" },
				{ type: "callout", x: -345, y: 185, content: "Ring" },
				{ type: "callout", x: -118, y: 282, content: "Pit" },
				{ type: "callout", x: -793, y: 52, content: "Bats" },
				{ type: "callout", x: -457, y: -247, content: "Ramp" },
				{ type: "callout", x: -357, y: -321, content: "Grate" }
			],
			TC: [
				{ type: "callout", x: -704, y: -306, content: "Spawn" },
				{ type: "callout", x: -584, y: -81, content: "Plat" },
				{ type: "callout", x: -279, y: -116, content: "Court" },
				{ type: "callout", x: -100, y: -263, content: "Snipe" },
				{ type: "callout", x: 30, y: -154, content: "Tunnel" },
				{ type: "callout", x: -3, y: 7, content: "Mid" },
				{ type: "callout", x: -209, y: 154, content: "Grass" },
				{ type: "callout", x: -282, y: 1, content: "Spine" },
				{ type: "callout", x: -449, y: 0, content: "Steps" },
				{ type: "callout", x: -550, y: -4, content: "Perch" },
				{ type: "callout", x: -345, y: 185, content: "Ring" },
				{ type: "callout", x: -118, y: 282, content: "Pit" },
				{ type: "callout", x: -793, y: 52, content: "Bats" },
				{ type: "callout", x: -357, y: -321, content: "Grate" }
			],
			RM: [
				{ type: "callout", x: -704, y: -306, content: "Spawn" },
				{ type: "callout", x: -584, y: -81, content: "Plat" },
				{ type: "callout", x: -279, y: -116, content: "Court" },
				{ type: "callout", x: -100, y: -263, content: "Snipe" },
				{ type: "callout", x: 30, y: -154, content: "Tunnel" },
				{ type: "callout", x: -41, y: -107, content: "Glass" },
				{ type: "callout", x: -3, y: 7, content: "Mid" },
				{ type: "callout", x: -209, y: 154, content: "Grass" },
				{ type: "callout", x: -282, y: 1, content: "Spine" },
				{ type: "callout", x: -449, y: -50, content: "Sponge" },
				{ type: "callout", x: -550, y: -4, content: "Perch" },
				{ type: "callout", x: -345, y: 185, content: "Ring" },
				{ type: "callout", x: -118, y: 282, content: "Pit" },
				{ type: "callout", x: -793, y: 52, content: "Bats" },
				{ type: "callout", x: -457, y: -247, content: "Ramp" },
				{ type: "callout", x: -357, y: -321, content: "Grate" },
				{ type: "callout", x: -495, y: 303, content: "Left Check" },
				{ type: "callout", x: -614, y: 168, content: "Choke" }
			],
			CB: [
				{ type: "callout", x: -704, y: -306, content: "Spawn" },
				{ type: "callout", x: -584, y: -81, content: "Plat" },
				{ type: "callout", x: -279, y: -116, content: "Court" },
				{ type: "callout", x: -100, y: -263, content: "Snipe" },
				{ type: "callout", x: 30, y: -154, content: "Tunnel" },
				{ type: "callout", x: -41, y: -107, content: "Glass" },
				{ type: "callout", x: -3, y: 7, content: "Mid" },
				{ type: "callout", x: -209, y: 154, content: "Grass" },
				{ type: "callout", x: -282, y: 1, content: "Spine" },
				{ type: "callout", x: -449, y: -50, content: "Sponge" },
				{ type: "callout", x: -550, y: -4, content: "Perch" },
				{ type: "callout", x: -345, y: 185, content: "Ring" },
				{ type: "callout", x: -118, y: 282, content: "Pit" },
				{ type: "callout", x: -793, y: 52, content: "Bats" },
				{ type: "callout", x: -457, y: -247, content: "Ramp" },
				{ type: "callout", x: -357, y: -321, content: "Grate" }
			]
		}
	},
	MincemeatMetalworks: {
		name: "Mincemeat Metalworks",
		alias: ["Mincemeat", "Metalworks", "MM", "MMM"],
		id: 4,
		minimap: {
			rotation: -45,
			scale: 0.55,
			translate: {
				x: 0,
				y: 40
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -12, y: -2, content: "Top Mid" },
				{ type: "callout", x: 71, y: 81, content: "Mid" },
				{ type: "callout", x: -35, y: 147, content: "Truck" },
				{ type: "callout", x: -196, y: 222, content: "Pit" },
				{ type: "callout", x: -274, y: 313, content: "Elbow" },
				{ type: "callout", x: -354, y: 59, content: "Plat" },
				{ type: "callout", x: -239, y: -35, content: "Snipe" },
				{ type: "callout", x: -326, y: -173, content: "Court" },
				{ type: "callout", x: -61, y: -200, content: "Drop" },
				{ type: "callout", x: -499, y: -178, content: "Ramp" },
				{ type: "callout", x: -606, y: -158, content: "Bus" },
				{ type: "callout", x: -844, y: 45, content: "High Spawn" },
				{ type: "callout", x: -590, y: 33, content: "Low Spawn" },
				{ type: "callout", x: -492, y: 318, content: "Grates" },
				{ type: "callout", x: -196, y: 124, content: "Bridge" }
			],
			SZ: [
				{ type: "callout", x: -12, y: -2, content: "Top Mid" },
				{ type: "callout", x: 71, y: 81, content: "Mid" },
				{ type: "callout", x: -35, y: 147, content: "Truck" },
				{ type: "callout", x: -196, y: 222, content: "Pit" },
				{ type: "callout", x: -274, y: 313, content: "Elbow" },
				{ type: "callout", x: -354, y: 59, content: "Plat" },
				{ type: "callout", x: -239, y: -35, content: "Snipe" },
				{ type: "callout", x: -326, y: -173, content: "Court" },
				{ type: "callout", x: -61, y: -200, content: "Drop" },
				{ type: "callout", x: -499, y: -178, content: "Ramp" },
				{ type: "callout", x: -606, y: -158, content: "Bus" },
				{ type: "callout", x: -844, y: 45, content: "High Spawn" },
				{ type: "callout", x: -590, y: 33, content: "Low Spawn" },
				{ type: "callout", x: -492, y: 318, content: "Grates" },
				{ type: "callout", x: -196, y: 124, content: "Bridge" }
			],
			TC: [
				{ type: "callout", x: -12, y: -2, content: "Top Mid" },
				{ type: "callout", x: 71, y: 81, content: "Mid" },
				{ type: "callout", x: -35, y: 147, content: "Truck" },
				{ type: "callout", x: -196, y: 222, content: "Pit" },
				{ type: "callout", x: -274, y: 313, content: "Elbow" },
				{ type: "callout", x: -354, y: 59, content: "Plat" },
				{ type: "callout", x: -239, y: -35, content: "Snipe" },
				{ type: "callout", x: -326, y: -173, content: "Court" },
				{ type: "callout", x: -61, y: -200, content: "Drop" },
				{ type: "callout", x: -499, y: -178, content: "Ramp" },
				{ type: "callout", x: -606, y: -158, content: "Bus" },
				{ type: "callout", x: -844, y: 45, content: "High Spawn" },
				{ type: "callout", x: -590, y: 33, content: "Goal" },
				{ type: "callout", x: -492, y: 318, content: "Grates" }
			],
			RM: [
				{ type: "callout", x: -12, y: -2, content: "Top Mid" },
				{ type: "callout", x: 71, y: 81, content: "Mid" },
				{ type: "callout", x: -35, y: 147, content: "Truck" },
				{ type: "callout", x: -196, y: 222, content: "Pit" },
				{ type: "callout", x: -274, y: 313, content: "Elbow" },
				{ type: "callout", x: -354, y: 59, content: "Plat" },
				{ type: "callout", x: -239, y: -35, content: "Snipe" },
				{ type: "callout", x: -326, y: -173, content: "Court" },
				{ type: "callout", x: -61, y: -200, content: "Drop" },
				{ type: "callout", x: -499, y: -178, content: "Ramp" },
				{ type: "callout", x: -606, y: -158, content: "Bus" },
				{ type: "callout", x: -844, y: 45, content: "High Spawn" },
				{ type: "callout", x: -590, y: 33, content: "Goal" },
				{ type: "callout", x: -492, y: 318, content: "Grates" },
				{ type: "callout", x: -196, y: 124, content: "Bridge" }
			],
			CB: [
				{ type: "callout", x: -12, y: -2, content: "Top Mid" },
				{ type: "callout", x: 71, y: 81, content: "Mid" },
				{ type: "callout", x: -35, y: 147, content: "Truck" },
				{ type: "callout", x: -196, y: 222, content: "Pit" },
				{ type: "callout", x: -274, y: 313, content: "Elbow" },
				{ type: "callout", x: -354, y: 59, content: "Plat" },
				{ type: "callout", x: -239, y: -35, content: "Snipe" },
				{ type: "callout", x: -326, y: -173, content: "Court" },
				{ type: "callout", x: -61, y: -200, content: "Drop" },
				{ type: "callout", x: -499, y: -178, content: "Ramp" },
				{ type: "callout", x: -606, y: -158, content: "Bus" },
				{ type: "callout", x: -844, y: 45, content: "High Spawn" },
				{ type: "callout", x: -590, y: 33, content: "Low Spawn" },
				{ type: "callout", x: -492, y: 318, content: "Grates" },
				{ type: "callout", x: -196, y: 124, content: "Bridge" }
			]
		}
	},
	HammerheadBridge: {
		name: "Hammerhead Bridge",
		alias: ["Hammerhead", "Bridge", "HB", "HHB"],
		id: 5,
		minimap: {
			rotation: -50,
			scale: 0.62,
			translate: {
				x: 30,
				y: 10
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -800, y: 4, content: "Spawn" },
				{ type: "callout", x: -621, y: 8, content: "Summit" },
				{ type: "callout", x: -495, y: -110, content: "Perch" },
				{ type: "callout", x: -516, y: 103, content: "Bats" },
				{ type: "callout", x: -380, y: -52, content: "Ledge" },
				{ type: "callout", x: -314, y: 28, content: "Plat" },
				{ type: "callout", x: -217, y: -56, content: "Snipe" },
				{ type: "callout", x: -184, y: -170, content: "Drop" },
				{ type: "callout", x: 9, y: -165, content: "Left Pit" },
				{ type: "callout", x: -66, y: 177, content: "Right Pit" },
				{ type: "callout", x: -3, y: 5, content: "Mid" },
				{ type: "callout", x: -219, y: 0, content: "Ramp" },
				{ type: "callout", x: -448, y: 41, content: "Slope" }
			],
			SZ: [
				{ type: "callout", x: -800, y: 4, content: "Spawn" },
				{ type: "callout", x: -621, y: 8, content: "Summit" },
				{ type: "callout", x: -495, y: -110, content: "Perch" },
				{ type: "callout", x: -516, y: 103, content: "Bats" },
				{ type: "callout", x: -380, y: -52, content: "Ledge" },
				{ type: "callout", x: -314, y: 28, content: "Plat" },
				{ type: "callout", x: -217, y: -56, content: "Snipe" },
				{ type: "callout", x: -184, y: -170, content: "Drop" },
				{ type: "callout", x: 9, y: -165, content: "Left Pit" },
				{ type: "callout", x: -66, y: 177, content: "Right Pit" },
				{ type: "callout", x: -3, y: 5, content: "Mid" },
				{ type: "callout", x: -219, y: 0, content: "Ramp" },
				{ type: "callout", x: -448, y: 41, content: "Slope" }
			],
			TC: [
				{ type: "callout", x: -800, y: 4, content: "Spawn" },
				{ type: "callout", x: -621, y: 8, content: "Summit" },
				{ type: "callout", x: -495, y: -110, content: "Perch" },
				{ type: "callout", x: -516, y: 103, content: "Bats" },
				{ type: "callout", x: -380, y: -52, content: "Ledge" },
				{ type: "callout", x: -314, y: 28, content: "Plat" },
				{ type: "callout", x: -217, y: -56, content: "Snipe" },
				{ type: "callout", x: -178, y: 11, content: "Box" },
				{ type: "callout", x: -184, y: -170, content: "Drop" },
				{ type: "callout", x: 9, y: -165, content: "Left Pit" },
				{ type: "callout", x: -66, y: 177, content: "Right Pit" },
				{ type: "callout", x: -3, y: 5, content: "Mid" },
				{ type: "callout", x: -219, y: 89, content: "Ramp" },
				{ type: "callout", x: -448, y: 41, content: "Slope" }
			],
			RM: [
				{ type: "callout", x: -800, y: 4, content: "Spawn" },
				{ type: "callout", x: -621, y: 8, content: "Summit" },
				{ type: "callout", x: -495, y: -110, content: "Perch" },
				{ type: "callout", x: -516, y: 103, content: "Bats" },
				{ type: "callout", x: -380, y: -52, content: "Ledge" },
				{ type: "callout", x: -314, y: 28, content: "Plat" },
				{ type: "callout", x: -217, y: -56, content: "Snipe" },
				{ type: "callout", x: -178, y: 11, content: "Box" },
				{ type: "callout", x: -184, y: -170, content: "Drop" },
				{ type: "callout", x: 9, y: -165, content: "Left Pit" },
				{ type: "callout", x: -66, y: 177, content: "Right Pit" },
				{ type: "callout", x: -3, y: 5, content: "Mid" },
				{ type: "callout", x: -219, y: 89, content: "Ramp" },
				{ type: "callout", x: -448, y: 41, content: "Slope" }
			],
			CB: [
				{ type: "callout", x: -800, y: 4, content: "Spawn" },
				{ type: "callout", x: -621, y: 8, content: "Summit" },
				{ type: "callout", x: -495, y: -110, content: "Perch" },
				{ type: "callout", x: -516, y: 103, content: "Bats" },
				{ type: "callout", x: -380, y: -52, content: "Ledge" },
				{ type: "callout", x: -314, y: 28, content: "Plat" },
				{ type: "callout", x: -217, y: -56, content: "Snipe" },
				{ type: "callout", x: -178, y: 11, content: "Box" },
				{ type: "callout", x: -184, y: -170, content: "Drop" },
				{ type: "callout", x: 9, y: -165, content: "Left Pit" },
				{ type: "callout", x: -66, y: 177, content: "Right Pit" },
				{ type: "callout", x: -3, y: 5, content: "Mid" },
				{ type: "callout", x: -219, y: 89, content: "Ramp" },
				{ type: "callout", x: -448, y: 41, content: "Slope" }
			]
		}
	},
	MuseumDAlfonsino: {
		name: "Museum d'Alfonsino",
		alias: ["Museum", "MU", "MUS"],
		id: 6,
		minimap: {
			rotation: -60,
			scale: 0.9,
			translate: {
				x: -40,
				y: 0
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -395, y: -231, content: "Spawn" },
				{ type: "callout", x: -178, y: -344, content: "Lookout" },
				{ type: "callout", x: -234, y: -197, content: "Dip" },
				{ type: "callout", x: -245, y: -85, content: "Elbow" },
				{ type: "callout", x: -216, y: 55, content: "Drop" },
				{ type: "callout", x: 212, y: -127, content: "Pit" },
				{ type: "callout", x: 112, y: -233, content: "Slick" },
				{ type: "callout", x: -22, y: -262, content: "Alley" },
				{ type: "callout", x: -14, y: -188, content: "Spinner" },
				{ type: "callout", x: 4, y: -119, content: "Plat" },
				{ type: "callout", x: -124, y: -93, content: "Corner" },
				{ type: "callout", x: -155, y: -6, content: "Screen" },
				{ type: "callout", x: -15, y: 47, content: "Top Mid" },
				{ type: "callout", x: 51, y: -26, content: "Mid" },
				{ type: "callout", x: 80, y: -327, content: "Bunker" },
				{ type: "callout", x: -142, y: -287, content: "Steps" }
			],
			SZ: [
				{ type: "callout", x: -395, y: -231, content: "Spawn" },
				{ type: "callout", x: -178, y: -344, content: "Lookout" },
				{ type: "callout", x: -234, y: -197, content: "Dip" },
				{ type: "callout", x: -245, y: -85, content: "Elbow" },
				{ type: "callout", x: -216, y: 55, content: "Drop" },
				{ type: "callout", x: 212, y: -127, content: "Pit" },
				{ type: "callout", x: 112, y: -233, content: "Slick" },
				{ type: "callout", x: -22, y: -262, content: "Alley" },
				{ type: "callout", x: -14, y: -188, content: "Spinner" },
				{ type: "callout", x: 4, y: -119, content: "Plat" },
				{ type: "callout", x: -124, y: -93, content: "Corner" },
				{ type: "callout", x: -155, y: -6, content: "Screen" },
				{ type: "callout", x: -15, y: 47, content: "Top Mid" },
				{ type: "callout", x: 51, y: -26, content: "Mid" },
				{ type: "callout", x: 80, y: -327, content: "Bunker" },
				{ type: "callout", x: -142, y: -287, content: "Steps" }
			],
			TC: [
				{ type: "callout", x: -395, y: -231, content: "Spawn" },
				{ type: "callout", x: -178, y: -344, content: "Lookout" },
				{ type: "callout", x: -234, y: -197, content: "Dip" },
				{ type: "callout", x: -245, y: -85, content: "Elbow" },
				{ type: "callout", x: -216, y: 55, content: "Drop" },
				{ type: "callout", x: 212, y: -127, content: "Pit" },
				{ type: "callout", x: 112, y: -233, content: "Slick" },
				{ type: "callout", x: -22, y: -262, content: "Alley" },
				{ type: "callout", x: -14, y: -188, content: "Spinner" },
				{ type: "callout", x: 4, y: -119, content: "Plat" },
				{ type: "callout", x: -124, y: -93, content: "Corner" },
				{ type: "callout", x: -155, y: -6, content: "Screen" },
				{ type: "callout", x: -15, y: 47, content: "Top Mid" },
				{ type: "callout", x: 51, y: -26, content: "Mid" },
				{ type: "callout", x: 80, y: -327, content: "Bunker" },
				{ type: "callout", x: -142, y: -287, content: "Steps" },
				{ type: "callout", x: 108, y: -97, content: "Block" }
			],
			RM: [
				{ type: "callout", x: -395, y: -231, content: "Spawn" },
				{ type: "callout", x: -178, y: -344, content: "Lookout" },
				{ type: "callout", x: -234, y: -197, content: "Dip" },
				{ type: "callout", x: -245, y: -85, content: "Elbow" },
				{ type: "callout", x: -216, y: 55, content: "Drop" },
				{ type: "callout", x: 212, y: -127, content: "Pit" },
				{ type: "callout", x: 112, y: -233, content: "Slick" },
				{ type: "callout", x: -22, y: -262, content: "Alley" },
				{ type: "callout", x: -14, y: -188, content: "Spinner" },
				{ type: "callout", x: 4, y: -119, content: "Plat" },
				{ type: "callout", x: -124, y: -93, content: "Corner" },
				{ type: "callout", x: -155, y: -6, content: "Screen" },
				{ type: "callout", x: -15, y: 47, content: "Top Mid" },
				{ type: "callout", x: 51, y: -26, content: "Mid" },
				{ type: "callout", x: 80, y: -327, content: "Bunker" },
				{ type: "callout", x: -142, y: -287, content: "Steps" },
				{ type: "callout", x: 108, y: -97, content: "Ramp" }
			],
			CB: [
				{ type: "callout", x: -395, y: -231, content: "Spawn" },
				{ type: "callout", x: -178, y: -344, content: "Lookout" },
				{ type: "callout", x: -234, y: -197, content: "Dip" },
				{ type: "callout", x: -245, y: -85, content: "Elbow" },
				{ type: "callout", x: -216, y: 55, content: "Drop" },
				{ type: "callout", x: 212, y: -127, content: "Pit" },
				{ type: "callout", x: 112, y: -233, content: "Slick" },
				{ type: "callout", x: -22, y: -262, content: "Alley" },
				{ type: "callout", x: -14, y: -188, content: "Spinner" },
				{ type: "callout", x: 4, y: -119, content: "Plat" },
				{ type: "callout", x: -124, y: -93, content: "Corner" },
				{ type: "callout", x: -155, y: -6, content: "Screen" },
				{ type: "callout", x: -15, y: 47, content: "Top Mid" },
				{ type: "callout", x: 51, y: -26, content: "Mid" },
				{ type: "callout", x: 80, y: -327, content: "Bunker" },
				{ type: "callout", x: -142, y: -287, content: "Steps" },
				{ type: "callout", x: 108, y: -97, content: "Ramp" }
			]
		}
	},
	MahiMahiResort: {
		name: "Mahi-Mahi Resort",
		alias: ["Mahi", "MahiMahi", "Mahi-Mahi", "Resort", "MR", "MMR"],
		id: 7,
		minimap: {
			rotation: -45,
			scale: 0.7,
			translate: {
				x: 0,
				y: 0
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -164, y: 20, content: "Snipe" },
				{ type: "callout", x: -9, y: 43, content: "Top Mid" },
				{ type: "callout", x: -39, y: -58, content: "Mid" },
				{ type: "callout", x: 57, y: -233, content: "Flood" },
				{ type: "callout", x: -90, y: -320, content: "Islands" },
				{ type: "callout", x: -258, y: -130, content: "Jump" },
				{ type: "callout", x: -408, y: -162, content: "Court" },
				{ type: "callout", x: -221, y: 37, content: "Slick" },
				{ type: "callout", x: -2, y: 232, content: "Corner" },
				{ type: "callout", x: -293, y: 14, content: "Plat" },
				{ type: "callout", x: -424, y: 42, content: "Perch" },
				{ type: "callout", x: -605, y: -148, content: "Spawn" }
			],
			SZ: [
				{ type: "callout", x: -164, y: 20, content: "Snipe" },
				{ type: "callout", x: -9, y: 43, content: "Zone" },
				{ type: "callout", x: 57, y: -233, content: "Flood" },
				{ type: "callout", x: -90, y: -320, content: "Islands" },
				{ type: "callout", x: -258, y: -130, content: "Jump" },
				{ type: "callout", x: -408, y: -162, content: "Court" },
				{ type: "callout", x: -221, y: 37, content: "Slick" },
				{ type: "callout", x: -2, y: 232, content: "Corner" },
				{ type: "callout", x: -293, y: 14, content: "Plat" },
				{ type: "callout", x: -424, y: 42, content: "Perch" },
				{ type: "callout", x: -605, y: -148, content: "Spawn" }
			],
			TC: [
				{ type: "callout", x: -4, y: 36, content: "Mid" },
				{ type: "callout", x: -72, y: -66, content: "Block" },
				{ type: "callout", x: -135, y: 57, content: "Drop" },
				{ type: "callout", x: -205, y: -36, content: "Slick" },
				{ type: "callout", x: -301, y: 74, content: "Plat" },
				{ type: "callout", x: -430, y: 166, content: "Perch" },
				{ type: "callout", x: -452, y: -9, content: "Court" },
				{ type: "callout", x: -577, y: -146, content: "Spawn" },
				{ type: "callout", x: -130, y: 185, content: "Street" },
				{ type: "callout", x: 81, y: -184, content: "Flood" },
				{ type: "callout", x: -105, y: -305, content: "Islands" },
				{ type: "callout", x: -250, y: -128, content: "Jump" }
			],
			RM: [
				{ type: "callout", x: 5, y: 37, content: "Mid" },
				{ type: "callout", x: -117, y: -55, content: "Block" },
				{ type: "callout", x: 9, y: -172, content: "Flood" },
				{ type: "callout", x: -175, y: -297, content: "Islands" },
				{ type: "callout", x: -602, y: -164, content: "Spawn" },
				{ type: "callout", x: -479, y: -5, content: "Court" },
				{ type: "callout", x: -511, y: 176, content: "Perch" },
				{ type: "callout", x: -296, y: 53, content: "Plat" },
				{ type: "callout", x: -105, y: 159, content: "Ramp" },
				{ type: "callout", x: -256, y: -140, content: "Jump" },
				{ type: "callout", x: -201, y: 31, content: "Slick" }
			],
			CB: [
				{ type: "callout", x: 5, y: 37, content: "Mid" },
				{ type: "callout", x: -117, y: 60, content: "Block" },
				{ type: "callout", x: 9, y: -172, content: "Flood" },
				{ type: "callout", x: -175, y: -297, content: "Islands" },
				{ type: "callout", x: -602, y: -164, content: "Spawn" },
				{ type: "callout", x: -479, y: -5, content: "Court" },
				{ type: "callout", x: -511, y: 176, content: "Perch" },
				{ type: "callout", x: -296, y: 53, content: "Plat" },
				{ type: "callout", x: -105, y: 159, content: "Ramp" },
				{ type: "callout", x: -256, y: -140, content: "Jump" },
				{ type: "callout", x: -201, y: 31, content: "Slick" }
			]
		}
	},
	InkblotArtAcademy: {
		name: "Inkblot Art Academy",
		alias: ["Inkblot", "Academy", "IA", "IAA"],
		id: 8,
		minimap: {
			rotation: -70,
			scale: 0.7,
			translate: {
				x: -50,
				y: 20
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -2, y: 54, content: "Top Mid" },
				{ type: "callout", x: -133, y: 95, content: "Wall" },
				{ type: "callout", x: -179, y: 162, content: "Choke" },
				{ type: "callout", x: -295, y: 214, content: "Snipe" },
				{ type: "callout", x: -426, y: 156, content: "Booth" },
				{ type: "callout", x: -381, y: 74, content: "Perch" },
				{ type: "callout", x: -263, y: 70, content: "Shell" },
				{ type: "callout", x: 0, y: -104, content: "Left Stack" },
				{ type: "callout", x: 5, y: 204, content: "Right Stack" },
				{ type: "callout", x: -78, y: -17, content: "Mid" },
				{ type: "callout", x: -253, y: -128, content: "Attic" },
				{ type: "callout", x: -333, y: -348, content: "Alley" },
				{ type: "callout", x: -110, y: -268, content: "Drop" },
				{ type: "callout", x: 12, y: -226, content: "Tree" },
				{ type: "callout", x: -419, y: -15, content: "Bats" },
				{ type: "callout", x: -265, y: -24, content: "Plat" },
				{ type: "callout", x: -482, y: -161, content: "Slick" },
				{ type: "callout", x: -538, y: -308, content: "Spawn" }
			],
			SZ: [
				{ type: "callout", x: -2, y: 54, content: "Top Mid" },
				{ type: "callout", x: -133, y: 95, content: "Wall" },
				{ type: "callout", x: -179, y: 162, content: "Choke" },
				{ type: "callout", x: -295, y: 214, content: "Snipe" },
				{ type: "callout", x: -426, y: 156, content: "Booth" },
				{ type: "callout", x: -381, y: 74, content: "Perch" },
				{ type: "callout", x: -263, y: 70, content: "Shell" },
				{ type: "callout", x: 0, y: -104, content: "Left Stack" },
				{ type: "callout", x: 5, y: 204, content: "Right Stack" },
				{ type: "callout", x: -78, y: -17, content: "Mid" },
				{ type: "callout", x: -253, y: -128, content: "Attic" },
				{ type: "callout", x: -333, y: -348, content: "Alley" },
				{ type: "callout", x: -110, y: -268, content: "Drop" },
				{ type: "callout", x: 12, y: -226, content: "Tree" },
				{ type: "callout", x: -419, y: -15, content: "Bats" },
				{ type: "callout", x: -265, y: -24, content: "Plat" },
				{ type: "callout", x: -482, y: -161, content: "Slick" },
				{ type: "callout", x: -538, y: -308, content: "Spawn" }
			],
			TC: [
				{ type: "callout", x: -2, y: 54, content: "Mid" },
				{ type: "callout", x: -133, y: 95, content: "Wall" },
				{ type: "callout", x: -179, y: 162, content: "Choke" },
				{ type: "callout", x: -295, y: 214, content: "Snipe" },
				{ type: "callout", x: -426, y: 156, content: "Booth" },
				{ type: "callout", x: -381, y: 74, content: "Perch" },
				{ type: "callout", x: -263, y: 70, content: "Shell" },
				{ type: "callout", x: 0, y: -104, content: "Left Stack" },
				{ type: "callout", x: 5, y: 204, content: "Right Stack" },
				{ type: "callout", x: -253, y: -128, content: "Attic" },
				{ type: "callout", x: -333, y: -348, content: "Alley" },
				{ type: "callout", x: -110, y: -268, content: "Drop" },
				{ type: "callout", x: 12, y: -226, content: "Tree" },
				{ type: "callout", x: -419, y: -15, content: "Bats" },
				{ type: "callout", x: -265, y: -24, content: "Plat" },
				{ type: "callout", x: -482, y: -161, content: "Slick" },
				{ type: "callout", x: -538, y: -308, content: "Spawn" },
				{ type: "callout", x: -321, y: -221, content: "Goal" }
			],
			RM: [
				{ type: "callout", x: -2, y: 54, content: "Mid" },
				{ type: "callout", x: -133, y: 95, content: "Wall" },
				{ type: "callout", x: -179, y: 162, content: "Choke" },
				{ type: "callout", x: -295, y: 214, content: "Snipe" },
				{ type: "callout", x: -426, y: 156, content: "Booth" },
				{ type: "callout", x: -381, y: 74, content: "Perch" },
				{ type: "callout", x: -263, y: 70, content: "Shell" },
				{ type: "callout", x: 0, y: -104, content: "Left Stack" },
				{ type: "callout", x: 5, y: 204, content: "Right Stack" },
				{ type: "callout", x: -253, y: -128, content: "Attic" },
				{ type: "callout", x: -333, y: -348, content: "Alley" },
				{ type: "callout", x: -110, y: -268, content: "Drop" },
				{ type: "callout", x: 12, y: -226, content: "Tree" },
				{ type: "callout", x: -419, y: -15, content: "Bats" },
				{ type: "callout", x: -265, y: -24, content: "Plat" },
				{ type: "callout", x: -482, y: -161, content: "Slick" },
				{ type: "callout", x: -538, y: -308, content: "Spawn" },
				{ type: "callout", x: -321, y: -221, content: "Goal" }
			],
			CB: [
				{ type: "callout", x: -2, y: 54, content: "Mid" },
				{ type: "callout", x: -133, y: 95, content: "Wall" },
				{ type: "callout", x: -179, y: 162, content: "Choke" },
				{ type: "callout", x: -295, y: 214, content: "Snipe" },
				{ type: "callout", x: -426, y: 156, content: "Booth" },
				{ type: "callout", x: -381, y: 74, content: "Perch" },
				{ type: "callout", x: -263, y: 70, content: "Shell" },
				{ type: "callout", x: 0, y: -104, content: "Left Stack" },
				{ type: "callout", x: 5, y: 204, content: "Right Stack" },
				{ type: "callout", x: -253, y: -128, content: "Attic" },
				{ type: "callout", x: -333, y: -348, content: "Alley" },
				{ type: "callout", x: -110, y: -268, content: "Drop" },
				{ type: "callout", x: 12, y: -226, content: "Tree" },
				{ type: "callout", x: -419, y: -15, content: "Bats" },
				{ type: "callout", x: -265, y: -24, content: "Plat" },
				{ type: "callout", x: -482, y: -161, content: "Slick" },
				{ type: "callout", x: -538, y: -308, content: "Spawn" }
			]
		}
	},
	SturgeonShipyard: {
		name: "Sturgeon Shipyard",
		alias: ["Sturgeon", "Shipyard", "SS", "SSY"],
		id: 9,
		minimap: {
			rotation: -30,
			scale: 0.65,
			translate: {
				x: 0,
				y: 0
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: 55, y: 177, content: "Main" },
				{ type: "callout", x: -47, y: 275, content: "Pit" },
				{ type: "callout", x: -164, y: 246, content: "Spools" },
				{ type: "callout", x: -147, y: 172, content: "Ramp" },
				{ type: "callout", x: -135, y: 4, content: "Bridge" },
				{ type: "callout", x: -223, y: 69, content: "Snipe" },
				{ type: "callout", x: -344, y: 14, content: "Court" },
				{ type: "callout", x: -359, y: -160, content: "Window" },
				{ type: "callout", x: -294, y: -264, content: "Scaffold" },
				{ type: "callout", x: -630, y: -40, content: "Bats" },
				{ type: "callout", x: -741, y: 173, content: "Spawn" },
				{ type: "callout", x: -526, y: 238, content: "Elbow" },
				{ type: "callout", x: -368, y: 272, content: "Gate" },
				{ type: "callout", x: -419, y: 365, content: "Cut" },
				{ type: "callout", x: -221, y: -115, content: "Grates" },
				{ type: "callout", x: -480, y: -51, content: "Plat" },
				{ type: "callout", x: -354, y: 84, content: "Sponge" }
			],
			SZ: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: 55, y: 177, content: "Main" },
				{ type: "callout", x: -47, y: 275, content: "Pit" },
				{ type: "callout", x: -164, y: 246, content: "Spools" },
				{ type: "callout", x: -147, y: 172, content: "Ramp" },
				{ type: "callout", x: -135, y: 4, content: "Bridge" },
				{ type: "callout", x: -223, y: 69, content: "Snipe" },
				{ type: "callout", x: -344, y: 14, content: "Court" },
				{ type: "callout", x: -359, y: -160, content: "Window" },
				{ type: "callout", x: -294, y: -264, content: "Scaffold" },
				{ type: "callout", x: -630, y: -40, content: "Bats" },
				{ type: "callout", x: -741, y: 173, content: "Spawn" },
				{ type: "callout", x: -526, y: 238, content: "Elbow" },
				{ type: "callout", x: -368, y: 272, content: "Gate" },
				{ type: "callout", x: -419, y: 365, content: "Cut" },
				{ type: "callout", x: -221, y: -115, content: "Grates" },
				{ type: "callout", x: -480, y: -51, content: "Plat" },
				{ type: "callout", x: -354, y: 84, content: "Sponge" }
			],
			TC: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: 55, y: 177, content: "Main" },
				{ type: "callout", x: -47, y: 275, content: "Pit" },
				{ type: "callout", x: -164, y: 246, content: "Spools" },
				{ type: "callout", x: -147, y: 172, content: "Ramp" },
				{ type: "callout", x: -135, y: 4, content: "Bridge" },
				{ type: "callout", x: -223, y: 69, content: "Snipe" },
				{ type: "callout", x: -344, y: 14, content: "Court" },
				{ type: "callout", x: -359, y: -160, content: "Window" },
				{ type: "callout", x: -294, y: -264, content: "Scaffold" },
				{ type: "callout", x: -630, y: -40, content: "Bats" },
				{ type: "callout", x: -741, y: 173, content: "Spawn" },
				{ type: "callout", x: -526, y: 238, content: "Elbow" },
				{ type: "callout", x: -368, y: 272, content: "Gate" },
				{ type: "callout", x: -419, y: 365, content: "Cut" },
				{ type: "callout", x: -221, y: -115, content: "Grates" },
				{ type: "callout", x: -538, y: -51, content: "Plat" },
				{ type: "callout", x: -354, y: 84, content: "Sponge" }
			],
			RM: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: 55, y: 177, content: "Main" },
				{ type: "callout", x: -47, y: 275, content: "Pit" },
				{ type: "callout", x: -164, y: 246, content: "Spools" },
				{ type: "callout", x: -147, y: 172, content: "Ramp" },
				{ type: "callout", x: -135, y: 4, content: "Bridge" },
				{ type: "callout", x: -223, y: 69, content: "Snipe" },
				{ type: "callout", x: -344, y: 14, content: "Court" },
				{ type: "callout", x: -359, y: -160, content: "Window" },
				{ type: "callout", x: -294, y: -264, content: "Scaffold" },
				{ type: "callout", x: -630, y: -40, content: "Bats" },
				{ type: "callout", x: -741, y: 173, content: "Spawn" },
				{ type: "callout", x: -526, y: 238, content: "Elbow" },
				{ type: "callout", x: -368, y: 272, content: "Gate" },
				{ type: "callout", x: -419, y: 365, content: "Cut" },
				{ type: "callout", x: -221, y: -115, content: "Grates" },
				{ type: "callout", x: -538, y: -51, content: "Plat" }
			],
			CB: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: 55, y: 177, content: "Main" },
				{ type: "callout", x: -47, y: 275, content: "Pit" },
				{ type: "callout", x: -164, y: 246, content: "Spools" },
				{ type: "callout", x: -147, y: 172, content: "Ramp" },
				{ type: "callout", x: -135, y: 4, content: "Bridge" },
				{ type: "callout", x: -223, y: 69, content: "Snipe" },
				{ type: "callout", x: -344, y: 14, content: "Court" },
				{ type: "callout", x: -359, y: -160, content: "Window" },
				{ type: "callout", x: -294, y: -264, content: "Scaffold" },
				{ type: "callout", x: -592, y: -122, content: "Bats" },
				{ type: "callout", x: -741, y: 173, content: "Spawn" },
				{ type: "callout", x: -526, y: 238, content: "Elbow" },
				{ type: "callout", x: -368, y: 272, content: "Gate" },
				{ type: "callout", x: -419, y: 365, content: "Cut" },
				{ type: "callout", x: -221, y: -115, content: "Grates" },
				{ type: "callout", x: -480, y: -51, content: "Plat" }
			]
		}
	},
	MakoMart: {
		name: "MakoMart",
		alias: ["Mako", "MK", "MKM"],
		id: 10,
		minimap: {
			rotation: -45,
			scale: 0.65,
			translate: {
				x: -40,
				y: -20
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -1, y: 61, content: "Mid" },
				{ type: "callout", x: -147, y: -48, content: "Stack" },
				{ type: "callout", x: -96, y: 262, content: "Screen" },
				{ type: "callout", x: -261, y: 60, content: "Freezer" },
				{ type: "callout", x: -393, y: -39, content: "Bunker" },
				{ type: "callout", x: -479, y: 135, content: "Stairs" },
				{ type: "callout", x: -686, y: -125, content: "Spawn" },
				{ type: "callout", x: -500, y: 324, content: "Bats" },
				{ type: "callout", x: -251, y: 397, content: "Drop" },
				{ type: "callout", x: -21, y: 312, content: "Court" },
				{ type: "callout", x: -292, y: 178, content: "Snipe" },
				{ type: "callout", x: -513, y: -71, content: "Pit" },
				{ type: "callout", x: -384, y: -166, content: "Street" },
				{ type: "callout", x: -196, y: 220, content: "Plat" }
			],
			SZ: [
				{ type: "callout", x: -1, y: 61, content: "Mid" },
				{ type: "callout", x: -147, y: -48, content: "Stack" },
				{ type: "callout", x: -96, y: 262, content: "Screen" },
				{ type: "callout", x: -261, y: 60, content: "Freezer" },
				{ type: "callout", x: -393, y: -39, content: "Bunker" },
				{ type: "callout", x: -479, y: 135, content: "Stairs" },
				{ type: "callout", x: -640, y: 186, content: "Spawn" },
				{ type: "callout", x: -500, y: 324, content: "Bats" },
				{ type: "callout", x: -251, y: 397, content: "Drop" },
				{ type: "callout", x: -21, y: 312, content: "Court" },
				{ type: "callout", x: -292, y: 178, content: "Snipe" },
				{ type: "callout", x: -513, y: -71, content: "Pit" },
				{ type: "callout", x: -384, y: -166, content: "Street" },
				{ type: "callout", x: -196, y: 220, content: "Plat" },
				{ type: "callout", x: -284, y: -277, content: "Perch" }
			],
			TC: [
				{ type: "callout", x: -1, y: 61, content: "Mid" },
				{ type: "callout", x: -147, y: -48, content: "Stack" },
				{ type: "callout", x: -96, y: 262, content: "Screen" },
				{ type: "callout", x: -261, y: 60, content: "Freezer" },
				{ type: "callout", x: -393, y: -39, content: "Bunker" },
				{ type: "callout", x: -479, y: 135, content: "Stairs" },
				{ type: "callout", x: -640, y: 186, content: "Spawn" },
				{ type: "callout", x: -500, y: 324, content: "Bats" },
				{ type: "callout", x: -251, y: 397, content: "Drop" },
				{ type: "callout", x: -21, y: 312, content: "Court" },
				{ type: "callout", x: -292, y: 178, content: "Snipe" },
				{ type: "callout", x: -513, y: -71, content: "Pit" },
				{ type: "callout", x: -384, y: -166, content: "Street" },
				{ type: "callout", x: -196, y: 220, content: "Plat" },
				{ type: "callout", x: -284, y: -277, content: "Perch" }
			],
			RM: [
				{ type: "callout", x: -1, y: 61, content: "Mid" },
				{ type: "callout", x: -147, y: -48, content: "Stack" },
				{ type: "callout", x: -96, y: 262, content: "Screen" },
				{ type: "callout", x: -261, y: 60, content: "Freezer" },
				{ type: "callout", x: -393, y: -39, content: "Bunker" },
				{ type: "callout", x: -479, y: 135, content: "Stairs" },
				{ type: "callout", x: -633, y: -348, content: "Spawn" },
				{ type: "callout", x: -500, y: 324, content: "Bats" },
				{ type: "callout", x: -251, y: 397, content: "Drop" },
				{ type: "callout", x: -21, y: 312, content: "Court" },
				{ type: "callout", x: -292, y: 178, content: "Snipe" },
				{ type: "callout", x: -513, y: -71, content: "Pit" },
				{ type: "callout", x: -384, y: -166, content: "Street" },
				{ type: "callout", x: -196, y: 220, content: "Plat" },
				{ type: "callout", x: -284, y: -277, content: "Perch" },
				{ type: "callout", x: -712, y: -101, content: "Goal" }
			],
			CB: [
				{ type: "callout", x: -1, y: 61, content: "Mid" },
				{ type: "callout", x: -147, y: -48, content: "Stack" },
				{ type: "callout", x: -96, y: 262, content: "Screen" },
				{ type: "callout", x: -261, y: 60, content: "Freezer" },
				{ type: "callout", x: -393, y: -39, content: "Bunker" },
				{ type: "callout", x: -479, y: 135, content: "Stairs" },
				{ type: "callout", x: -640, y: 186, content: "Spawn" },
				{ type: "callout", x: -500, y: 324, content: "Bats" },
				{ type: "callout", x: -251, y: 397, content: "Drop" },
				{ type: "callout", x: -21, y: 312, content: "Court" },
				{ type: "callout", x: -292, y: 178, content: "Snipe" },
				{ type: "callout", x: -513, y: -71, content: "Pit" },
				{ type: "callout", x: -384, y: -166, content: "Street" },
				{ type: "callout", x: -196, y: 220, content: "Plat" },
				{ type: "callout", x: -284, y: -277, content: "Perch" }
			]
		}
	},
	WahooWorld: {
		name: "Wahoo World",
		alias: ["Wahoo", "WW", "WHW"],
		id: 11,
		minimap: {
			rotation: -40,
			scale: 0.62,
			translate: {
				x: 0,
				y: -40
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: 3, y: 1, content: "Mid" },
				{ type: "callout", x: -139, y: 56, content: "Carousel" },
				{ type: "callout", x: -162, y: 169, content: "Wall" },
				{ type: "callout", x: -74, y: 160, content: "Glass" },
				{ type: "callout", x: -171, y: 325, content: "Snipe" },
				{ type: "callout", x: -382, y: -240, content: "Hill" },
				{ type: "callout", x: -216, y: -115, content: "Plat" },
				{ type: "callout", x: -392, y: 81, content: "Stairs" },
				{ type: "callout", x: -260, y: 80, content: "Court" },
				{ type: "callout", x: -376, y: 232, content: "Rail" },
				{ type: "callout", x: -389, y: 314, content: "Elbow" },
				{ type: "callout", x: -718, y: 11, content: "Spawn" },
				{ type: "callout", x: -544, y: -217, content: "Bats" }
			],
			SZ: [
				{ type: "callout", x: 3, y: 1, content: "Mid" },
				{ type: "callout", x: -139, y: 56, content: "Carousel" },
				{ type: "callout", x: -162, y: 169, content: "Wall" },
				{ type: "callout", x: -74, y: 160, content: "Glass" },
				{ type: "callout", x: -171, y: 325, content: "Snipe" },
				{ type: "callout", x: -382, y: -240, content: "Hill" },
				{ type: "callout", x: -216, y: -115, content: "Plat" },
				{ type: "callout", x: -392, y: 81, content: "Stairs" },
				{ type: "callout", x: -260, y: 80, content: "Court" },
				{ type: "callout", x: -376, y: 232, content: "Rail" },
				{ type: "callout", x: -389, y: 314, content: "Elbow" },
				{ type: "callout", x: -718, y: 11, content: "Spawn" },
				{ type: "callout", x: -544, y: -217, content: "Bats" },
				{ type: "callout", x: -114, y: 22, content: "Ledge" }
			],
			TC: [
				{ type: "callout", x: 3, y: 1, content: "Mid" },
				{ type: "callout", x: -139, y: 56, content: "Carousel" },
				{ type: "callout", x: -162, y: 169, content: "Wall" },
				{ type: "callout", x: -74, y: 160, content: "Glass" },
				{ type: "callout", x: -171, y: 325, content: "Snipe" },
				{ type: "callout", x: -382, y: -240, content: "Hill" },
				{ type: "callout", x: -216, y: -115, content: "Plat" },
				{ type: "callout", x: -392, y: 81, content: "Stairs" },
				{ type: "callout", x: -260, y: 80, content: "Court" },
				{ type: "callout", x: -376, y: 232, content: "Rail" },
				{ type: "callout", x: -389, y: 314, content: "Elbow" },
				{ type: "callout", x: -718, y: 11, content: "Spawn" },
				{ type: "callout", x: -544, y: -217, content: "Bats" },
				{ type: "callout", x: -511, y: 101, content: "Goal" },
				{ type: "callout", x: -114, y: 22, content: "Ledge" }
			],
			RM: [
				{ type: "callout", x: 3, y: 1, content: "Mid" },
				{ type: "callout", x: -139, y: 56, content: "Carousel" },
				{ type: "callout", x: -162, y: 169, content: "Wall" },
				{ type: "callout", x: -74, y: 160, content: "Glass" },
				{ type: "callout", x: -171, y: 325, content: "Snipe" },
				{ type: "callout", x: -382, y: -240, content: "Hill" },
				{ type: "callout", x: -216, y: -115, content: "Plat" },
				{ type: "callout", x: -392, y: 81, content: "Stairs" },
				{ type: "callout", x: -260, y: 80, content: "Court" },
				{ type: "callout", x: -376, y: 232, content: "Rail" },
				{ type: "callout", x: -389, y: 314, content: "Elbow" },
				{ type: "callout", x: -718, y: 11, content: "Spawn" },
				{ type: "callout", x: -544, y: -217, content: "Bats" },
				{ type: "callout", x: -511, y: 101, content: "Goal" }
			],
			CB: [
				{ type: "callout", x: 3, y: 1, content: "Mid" },
				{ type: "callout", x: -139, y: 56, content: "Carousel" },
				{ type: "callout", x: -162, y: 169, content: "Wall" },
				{ type: "callout", x: -74, y: 160, content: "Glass" },
				{ type: "callout", x: -171, y: 325, content: "Snipe" },
				{ type: "callout", x: -382, y: -240, content: "Hill" },
				{ type: "callout", x: -216, y: -115, content: "Plat" },
				{ type: "callout", x: -392, y: 81, content: "Stairs" },
				{ type: "callout", x: -260, y: 80, content: "Court" },
				{ type: "callout", x: -376, y: 232, content: "Rail" },
				{ type: "callout", x: -389, y: 314, content: "Elbow" },
				{ type: "callout", x: -718, y: 11, content: "Spawn" },
				{ type: "callout", x: -544, y: -217, content: "Bats" }
			]
		}
	},
	FlounderHeights: {
		name: "Flounder Heights",
		alias: ["Flounder", "Apartments", "Heights", "FH", "FLH"],
		id: 12,
		minimap: {
			rotation: -65,
			scale: 0.8,
			translate: {
				x: 0,
				y: -50
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -135, y: 123, content: "Flank" },
				{ type: "callout", x: -2, y: -272, content: "Plat" },
				{ type: "callout", x: -163, y: -364, content: "Alley" },
				{ type: "callout", x: -233, y: -277, content: "Ramp" },
				{ type: "callout", x: -190, y: -57, content: "Street" },
				{ type: "callout", x: -108, y: -97, content: "Pit" },
				{ type: "callout", x: 7, y: 18, content: "Bridge" },
				{ type: "callout", x: -81, y: -18, content: "Trench" },
				{ type: "callout", x: -295, y: -110, content: "Rail" },
				{ type: "callout", x: -304, y: 0, content: "Snipe" },
				{ type: "callout", x: -376, y: -246, content: "Court" },
				{ type: "callout", x: -413, y: -390, content: "Mattress" },
				{ type: "callout", x: -601, y: -247, content: "Spawn" },
				{ type: "callout", x: 7, y: -160, content: "Zone" }
			],
			SZ: [
				{ type: "callout", x: -135, y: 123, content: "Flank" },
				{ type: "callout", x: -2, y: -272, content: "Plat" },
				{ type: "callout", x: -163, y: -364, content: "Alley" },
				{ type: "callout", x: -233, y: -277, content: "Ramp" },
				{ type: "callout", x: -190, y: -57, content: "Street" },
				{ type: "callout", x: -108, y: -97, content: "Pit" },
				{ type: "callout", x: 7, y: 18, content: "Bridge" },
				{ type: "callout", x: -81, y: -18, content: "Trench" },
				{ type: "callout", x: -295, y: -110, content: "Rail" },
				{ type: "callout", x: -304, y: 0, content: "Snipe" },
				{ type: "callout", x: -376, y: -246, content: "Court" },
				{ type: "callout", x: -413, y: -390, content: "Mattress" },
				{ type: "callout", x: -601, y: -247, content: "Spawn" },
				{ type: "callout", x: 7, y: -160, content: "Zone" }
			],
			TC: [
				{ type: "callout", x: -135, y: 123, content: "Flank" },
				{ type: "callout", x: -2, y: -272, content: "Plat" },
				{ type: "callout", x: -163, y: -364, content: "Alley" },
				{ type: "callout", x: -233, y: -277, content: "Ramp" },
				{ type: "callout", x: -190, y: -57, content: "Street" },
				{ type: "callout", x: -108, y: -97, content: "Pit" },
				{ type: "callout", x: 7, y: 18, content: "Bridge" },
				{ type: "callout", x: -81, y: -18, content: "Trench" },
				{ type: "callout", x: -295, y: -110, content: "Rail" },
				{ type: "callout", x: -304, y: 0, content: "Snipe" },
				{ type: "callout", x: -376, y: -246, content: "Court" },
				{ type: "callout", x: -413, y: -390, content: "Mattress" },
				{ type: "callout", x: -601, y: -247, content: "Spawn" },
				{ type: "callout", x: 7, y: -160, content: "Zone" }
			],
			RM: [
				{ type: "callout", x: -135, y: 123, content: "Flank" },
				{ type: "callout", x: -2, y: -272, content: "Plat" },
				{ type: "callout", x: -233, y: -277, content: "Ramp" },
				{ type: "callout", x: -190, y: -57, content: "Street" },
				{ type: "callout", x: -108, y: -97, content: "Pit" },
				{ type: "callout", x: 7, y: 18, content: "Bridge" },
				{ type: "callout", x: -81, y: -18, content: "Trench" },
				{ type: "callout", x: -295, y: -110, content: "Rail" },
				{ type: "callout", x: -304, y: 0, content: "Snipe" },
				{ type: "callout", x: -376, y: -246, content: "Court" },
				{ type: "callout", x: -413, y: -390, content: "Mattress" },
				{ type: "callout", x: -601, y: -247, content: "Goal" },
				{ type: "callout", x: 7, y: -160, content: "Zone" },
				{ type: "callout", x: -758, y: -248, content: "Spawn" }
			],
			CB: [
				{ type: "callout", x: -135, y: 123, content: "Flank" },
				{ type: "callout", x: -2, y: -272, content: "Plat" },
				{ type: "callout", x: -163, y: -364, content: "Alley" },
				{ type: "callout", x: -233, y: -277, content: "Ramp" },
				{ type: "callout", x: -190, y: -57, content: "Street" },
				{ type: "callout", x: -108, y: -97, content: "Pit" },
				{ type: "callout", x: 7, y: 18, content: "Bridge" },
				{ type: "callout", x: -81, y: -18, content: "Trench" },
				{ type: "callout", x: -295, y: -110, content: "Rail" },
				{ type: "callout", x: -304, y: 0, content: "Snipe" },
				{ type: "callout", x: -376, y: -246, content: "Court" },
				{ type: "callout", x: -413, y: -390, content: "Mattress" },
				{ type: "callout", x: -601, y: -247, content: "Spawn" },
				{ type: "callout", x: 7, y: -160, content: "Zone" }
			]
		}
	},
	BrinewaterSprings: {
		name: "Brinewater Springs",
		alias: ["Brinewater", "Springs", "Brine", "BS", "BWS"],
		id: 13,
		minimap: {
			rotation: -30,
			scale: 0.75,
			translate: {
				x: 0,
				y: 0
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -267, y: 27, content: "Sneaky" },
				{ type: "callout", x: -637, y: 338, content: "Spawn" },
				{ type: "callout", x: -484, y: 257, content: "Drop" },
				{ type: "callout", x: -182, y: 403, content: "Bats" },
				{ type: "callout", x: 39, y: 403, content: "Roof" },
				{ type: "callout", x: 118, y: 319, content: "Perch" },
				{ type: "callout", x: -130, y: 228, content: "Ramp" },
				{ type: "callout", x: -103, y: 156, content: "Snipe" },
				{ type: "callout", x: 82, y: 199, content: "Plat" },
				{ type: "callout", x: -217, y: -169, content: "Tree" },
				{ type: "callout", x: -139, y: 33, content: "Sign" },
				{ type: "callout", x: -6, y: 2, content: "Top Mid" },
				{ type: "callout", x: 44, y: 57, content: "Mid" }
			],
			SZ: [
				{ type: "callout", x: -267, y: 27, content: "Sneaky" },
				{ type: "callout", x: -637, y: 338, content: "Spawn" },
				{ type: "callout", x: -484, y: 257, content: "Drop" },
				{ type: "callout", x: -182, y: 403, content: "Bats" },
				{ type: "callout", x: 39, y: 403, content: "Roof" },
				{ type: "callout", x: 118, y: 319, content: "Perch" },
				{ type: "callout", x: -130, y: 228, content: "Ramp" },
				{ type: "callout", x: -103, y: 156, content: "Snipe" },
				{ type: "callout", x: 82, y: 199, content: "Plat" },
				{ type: "callout", x: -217, y: -169, content: "Tree" },
				{ type: "callout", x: -139, y: 33, content: "Sign" },
				{ type: "callout", x: -6, y: 2, content: "Top Mid" },
				{ type: "callout", x: 44, y: 57, content: "Mid" }
			],
			TC: [
				{ type: "callout", x: -267, y: 27, content: "Sneaky" },
				{ type: "callout", x: -637, y: 338, content: "Spawn" },
				{ type: "callout", x: -484, y: 257, content: "Drop" },
				{ type: "callout", x: -182, y: 403, content: "Bats" },
				{ type: "callout", x: 39, y: 403, content: "Roof" },
				{ type: "callout", x: 118, y: 319, content: "Perch" },
				{ type: "callout", x: -130, y: 228, content: "Ramp" },
				{ type: "callout", x: -103, y: 156, content: "Snipe" },
				{ type: "callout", x: 82, y: 199, content: "Plat" },
				{ type: "callout", x: -217, y: -169, content: "Tree" },
				{ type: "callout", x: -139, y: 33, content: "Sign" },
				{ type: "callout", x: -6, y: 2, content: "Top Mid" },
				{ type: "callout", x: 44, y: 57, content: "Mid" }
			],
			RM: [
				{ type: "callout", x: -267, y: 27, content: "Sneaky" },
				{ type: "callout", x: -637, y: 338, content: "Spawn" },
				{ type: "callout", x: -484, y: 257, content: "Drop" },
				{ type: "callout", x: -182, y: 403, content: "Bats" },
				{ type: "callout", x: 39, y: 403, content: "Roof" },
				{ type: "callout", x: 118, y: 319, content: "Perch" },
				{ type: "callout", x: -130, y: 228, content: "Ramp" },
				{ type: "callout", x: -103, y: 156, content: "Snipe" },
				{ type: "callout", x: 82, y: 199, content: "Plat" },
				{ type: "callout", x: -217, y: -169, content: "Tree" },
				{ type: "callout", x: -139, y: 33, content: "Sign" },
				{ type: "callout", x: -6, y: 2, content: "Top Mid" },
				{ type: "callout", x: 44, y: 57, content: "Mid" }
			],
			CB: [
				{ type: "callout", x: -267, y: 27, content: "Sneaky" },
				{ type: "callout", x: -637, y: 338, content: "Spawn" },
				{ type: "callout", x: -484, y: 257, content: "Drop" },
				{ type: "callout", x: -182, y: 403, content: "Bats" },
				{ type: "callout", x: 39, y: 403, content: "Roof" },
				{ type: "callout", x: 118, y: 319, content: "Perch" },
				{ type: "callout", x: -130, y: 228, content: "Ramp" },
				{ type: "callout", x: -103, y: 156, content: "Snipe" },
				{ type: "callout", x: 82, y: 199, content: "Plat" },
				{ type: "callout", x: -217, y: -169, content: "Tree" },
				{ type: "callout", x: -139, y: 33, content: "Sign" },
				{ type: "callout", x: -6, y: 2, content: "Top Mid" },
				{ type: "callout", x: 44, y: 57, content: "Mid" }
			]
		}
	},
	MantaMaria: {
		name: "Manta Maria",
		alias: ["Manta", "Maria", "Ship", "MT", "MTM"],
		id: 14,
		minimap: {
			rotation: -45,
			scale: 0.6,
			translate: {
				x: 40,
				y: -20
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: -100, y: -92, content: "Cut" },
				{ type: "callout", x: -220, y: -105, content: "Jump" },
				{ type: "callout", x: -418, y: -169, content: "Raft" },
				{ type: "callout", x: -333, y: 27, content: "Street" },
				{ type: "callout", x: -475, y: 121, content: "Elbow" },
				{ type: "callout", x: -552, y: 29, content: "Mast" },
				{ type: "callout", x: -511, y: 272, content: "Rail" },
				{ type: "callout", x: -790, y: 67, content: "Spawn" },
				{ type: "callout", x: -382, y: 206, content: "Deck" },
				{ type: "callout", x: -228, y: 183, content: "Snipe" },
				{ type: "callout", x: -42, y: 253, content: "Plat" },
				{ type: "callout", x: -49, y: 97, content: "Mid" },
				{ type: "callout", x: -191, y: -10, content: "Bunker" },
				{ type: "callout", x: -498, y: -69, content: "Pit" },
				{ type: "callout", x: -164, y: 322, content: "Rings" }
			],
			SZ: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: -100, y: -92, content: "Cut" },
				{ type: "callout", x: -220, y: -105, content: "Jump" },
				{ type: "callout", x: -418, y: -169, content: "Raft" },
				{ type: "callout", x: -333, y: 27, content: "Street" },
				{ type: "callout", x: -475, y: 121, content: "Elbow" },
				{ type: "callout", x: -552, y: 29, content: "Mast" },
				{ type: "callout", x: -511, y: 272, content: "Rail" },
				{ type: "callout", x: -790, y: 67, content: "Spawn" },
				{ type: "callout", x: -382, y: 206, content: "Deck" },
				{ type: "callout", x: -228, y: 183, content: "Snipe" },
				{ type: "callout", x: -42, y: 253, content: "Plat" },
				{ type: "callout", x: -49, y: 97, content: "Mid" },
				{ type: "callout", x: -191, y: -10, content: "Bunker" },
				{ type: "callout", x: -498, y: -69, content: "Pit" },
				{ type: "callout", x: -164, y: 322, content: "Rings" }
			],
			TC: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: -100, y: -92, content: "Cut" },
				{ type: "callout", x: -220, y: -105, content: "Jump" },
				{ type: "callout", x: -418, y: -169, content: "Raft" },
				{ type: "callout", x: -333, y: 27, content: "Street" },
				{ type: "callout", x: -475, y: 121, content: "Elbow" },
				{ type: "callout", x: -552, y: 29, content: "Mast" },
				{ type: "callout", x: -511, y: 272, content: "Rail" },
				{ type: "callout", x: -790, y: 67, content: "Spawn" },
				{ type: "callout", x: -382, y: 206, content: "Deck" },
				{ type: "callout", x: -228, y: 183, content: "Snipe" },
				{ type: "callout", x: -42, y: 253, content: "Plat" },
				{ type: "callout", x: -49, y: 97, content: "Mid" },
				{ type: "callout", x: -191, y: -10, content: "Bunker" },
				{ type: "callout", x: -498, y: -69, content: "Pit" },
				{ type: "callout", x: -164, y: 322, content: "Rings" }
			],
			RM: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: -100, y: -92, content: "Cut" },
				{ type: "callout", x: -220, y: -105, content: "Jump" },
				{ type: "callout", x: -418, y: -169, content: "Raft" },
				{ type: "callout", x: -333, y: 27, content: "Street" },
				{ type: "callout", x: -475, y: 121, content: "Elbow" },
				{ type: "callout", x: -552, y: 29, content: "Mast" },
				{ type: "callout", x: -511, y: 272, content: "Rail" },
				{ type: "callout", x: -790, y: 67, content: "Spawn" },
				{ type: "callout", x: -382, y: 206, content: "Deck" },
				{ type: "callout", x: -228, y: 183, content: "Snipe" },
				{ type: "callout", x: -42, y: 253, content: "Plat" },
				{ type: "callout", x: -49, y: 97, content: "Mid" },
				{ type: "callout", x: -191, y: -10, content: "Bunker" },
				{ type: "callout", x: -498, y: -69, content: "Pit" },
				{ type: "callout", x: -164, y: 322, content: "Rings" }
			],
			CB: [
				{ type: "callout", x: 0, y: 0, content: "Top Mid" },
				{ type: "callout", x: -100, y: -92, content: "Cut" },
				{ type: "callout", x: -220, y: -105, content: "Jump" },
				{ type: "callout", x: -418, y: -169, content: "Raft" },
				{ type: "callout", x: -333, y: 27, content: "Street" },
				{ type: "callout", x: -475, y: 121, content: "Elbow" },
				{ type: "callout", x: -552, y: 29, content: "Mast" },
				{ type: "callout", x: -511, y: 272, content: "Rail" },
				{ type: "callout", x: -790, y: 67, content: "Spawn" },
				{ type: "callout", x: -382, y: 206, content: "Deck" },
				{ type: "callout", x: -228, y: 183, content: "Snipe" },
				{ type: "callout", x: -42, y: 253, content: "Plat" },
				{ type: "callout", x: -49, y: 97, content: "Mid" },
				{ type: "callout", x: -191, y: -10, content: "Bunker" },
				{ type: "callout", x: -498, y: -69, content: "Pit" },
				{ type: "callout", x: -164, y: 322, content: "Rings" }
			]
		}
	},
	UmamiRuins: {
		name: "Um'ami Ruins",
		alias: ["Umami", "Um'ami", "Ruins", "Egypt", "UR", "UMR"],
		id: 15,
		minimap: {
			rotation: -27,
			scale: 0.65,
			translate: {
				x: 0,
				y: 0
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -3, y: 1, content: "Top Mid" },
				{ type: "callout", x: 10, y: 100, content: "Mid" },
				{ type: "callout", x: -190, y: 20, content: "Court" },
				{ type: "callout", x: -63, y: 163, content: "Trench" },
				{ type: "callout", x: 109, y: 145, content: "Bags" },
				{ type: "callout", x: -291, y: -42, content: "Cubby" },
				{ type: "callout", x: -444, y: 6, content: "Pit" },
				{ type: "callout", x: -408, y: 72, content: "Bridge" },
				{ type: "callout", x: -226, y: 192, content: "Choke" },
				{ type: "callout", x: -363, y: 271, content: "Plat" },
				{ type: "callout", x: -137, y: 225, content: "Dome" },
				{ type: "callout", x: -88, y: 290, content: "Grate" },
				{ type: "callout", x: -557, y: 211, content: "Spawn" }
			],
			SZ: [
				{ type: "callout", x: -3, y: 1, content: "Top Mid" },
				{ type: "callout", x: 10, y: 100, content: "Zone" },
				{ type: "callout", x: -190, y: 20, content: "Court" },
				{ type: "callout", x: -63, y: 163, content: "Trench" },
				{ type: "callout", x: 109, y: 145, content: "Bags" },
				{ type: "callout", x: -291, y: -42, content: "Cubby" },
				{ type: "callout", x: -444, y: 6, content: "Pit" },
				{ type: "callout", x: -408, y: 72, content: "Bridge" },
				{ type: "callout", x: -226, y: 192, content: "Choke" },
				{ type: "callout", x: -363, y: 271, content: "Plat" },
				{ type: "callout", x: -137, y: 225, content: "Dome" },
				{ type: "callout", x: -88, y: 290, content: "Grate" },
				{ type: "callout", x: -557, y: 211, content: "Spawn" }
			],
			TC: [
				{ type: "callout", x: -3, y: 1, content: "Top Mid" },
				{ type: "callout", x: 10, y: 100, content: "Mid" },
				{ type: "callout", x: -190, y: 20, content: "Court" },
				{ type: "callout", x: -63, y: 163, content: "Trench" },
				{ type: "callout", x: 109, y: 145, content: "Bags" },
				{ type: "callout", x: -291, y: -42, content: "Cubby" },
				{ type: "callout", x: -444, y: 6, content: "Pit" },
				{ type: "callout", x: -408, y: 72, content: "Bridge" },
				{ type: "callout", x: -226, y: 192, content: "Choke" },
				{ type: "callout", x: -363, y: 271, content: "Plat" },
				{ type: "callout", x: -137, y: 225, content: "Dome" },
				{ type: "callout", x: -88, y: 290, content: "Grate" },
				{ type: "callout", x: -557, y: 211, content: "Spawn" }
			],
			RM: [
				{ type: "callout", x: -3, y: 1, content: "Top Mid" },
				{ type: "callout", x: 10, y: 100, content: "Mid" },
				{ type: "callout", x: -190, y: 20, content: "Court" },
				{ type: "callout", x: -63, y: 163, content: "Trench" },
				{ type: "callout", x: 109, y: 145, content: "Bags" },
				{ type: "callout", x: -291, y: -42, content: "Cubby" },
				{ type: "callout", x: -444, y: 6, content: "Pit" },
				{ type: "callout", x: -408, y: 72, content: "Bridge" },
				{ type: "callout", x: -226, y: 192, content: "Choke" },
				{ type: "callout", x: -363, y: 271, content: "Plat" },
				{ type: "callout", x: -137, y: 225, content: "Dome" },
				{ type: "callout", x: -88, y: 290, content: "Grate" },
				{ type: "callout", x: -557, y: 211, content: "Spawn" }
			],
			CB: [
				{ type: "callout", x: -3, y: 1, content: "Top Mid" },
				{ type: "callout", x: 10, y: 100, content: "Mid" },
				{ type: "callout", x: -190, y: 20, content: "Court" },
				{ type: "callout", x: -63, y: 163, content: "Trench" },
				{ type: "callout", x: 109, y: 145, content: "Bags" },
				{ type: "callout", x: -291, y: -42, content: "Cubby" },
				{ type: "callout", x: -444, y: 6, content: "Pit" },
				{ type: "callout", x: -408, y: 72, content: "Bridge" },
				{ type: "callout", x: -226, y: 192, content: "Choke" },
				{ type: "callout", x: -363, y: 271, content: "Plat" },
				{ type: "callout", x: -137, y: 225, content: "Dome" },
				{ type: "callout", x: -88, y: 290, content: "Grate" },
				{ type: "callout", x: -557, y: 211, content: "Spawn" }
			]
		}
	},
	HumpbackPumpTrack: {
		name: "Humpback Pump Track",
		alias: ["Humpback", "Pumptrack", "Skateboard", "HP", "HPT"],
		id: 16,
		minimap: {
			rotation: -35,
			scale: 0.6,
			translate: {
				x: 0,
				y: -10
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -182, y: -71, content: "Trench" },
				{ type: "callout", x: -162, y: 9, content: "Cubby" },
				{ type: "callout", x: -2, y: -2, content: "Mid" },
				{ type: "callout", x: -7, y: -191, content: "Wing" },
				{ type: "callout", x: -187, y: -352, content: "Elbow" },
				{ type: "callout", x: -337, y: -218, content: "Plat" },
				{ type: "callout", x: -468, y: -237, content: "Foam Pit" },
				{ type: "callout", x: -619, y: -49, content: "Spawn" },
				{ type: "callout", x: -505, y: -98, content: "Slick" },
				{ type: "callout", x: -318, y: 85, content: "Court" },
				{ type: "callout", x: -218, y: 172, content: "Bunker" },
				{ type: "callout", x: -358, y: 361, content: "Stairs" },
				{ type: "callout", x: -134, y: 412, content: "Street" },
				{ type: "callout", x: -72, y: 290, content: "Pit" },
				{ type: "callout", x: -225, y: -160, content: "Window" },
				{ type: "callout", x: 12, y: -317, content: "Jump" }
			],
			SZ: [
				{ type: "callout", x: -182, y: -71, content: "Trench" },
				{ type: "callout", x: -162, y: 9, content: "Cubby" },
				{ type: "callout", x: -2, y: -2, content: "Mid" },
				{ type: "callout", x: -7, y: -191, content: "Wing" },
				{ type: "callout", x: -187, y: -352, content: "Elbow" },
				{ type: "callout", x: -337, y: -218, content: "Plat" },
				{ type: "callout", x: -468, y: -237, content: "Foam Pit" },
				{ type: "callout", x: -619, y: -49, content: "Spawn" },
				{ type: "callout", x: -505, y: -98, content: "Slick" },
				{ type: "callout", x: -318, y: 85, content: "Court" },
				{ type: "callout", x: -218, y: 172, content: "Bunker" },
				{ type: "callout", x: -358, y: 361, content: "Stairs" },
				{ type: "callout", x: -134, y: 412, content: "Street" },
				{ type: "callout", x: -72, y: 290, content: "Pit" },
				{ type: "callout", x: -225, y: -160, content: "Window" },
				{ type: "callout", x: 12, y: -317, content: "Jump" },
				{ type: "callout", x: 32, y: -415, content: "Wall" }
			],
			TC: [
				{ type: "callout", x: -182, y: -71, content: "Trench" },
				{ type: "callout", x: -162, y: 9, content: "Cubby" },
				{ type: "callout", x: -2, y: -2, content: "Mid" },
				{ type: "callout", x: -7, y: -191, content: "Wing" },
				{ type: "callout", x: -187, y: -352, content: "Elbow" },
				{ type: "callout", x: -337, y: -218, content: "Plat" },
				{ type: "callout", x: -468, y: -237, content: "Foam Pit" },
				{ type: "callout", x: -619, y: -49, content: "Spawn" },
				{ type: "callout", x: -505, y: -98, content: "Slick" },
				{ type: "callout", x: -318, y: 85, content: "Court" },
				{ type: "callout", x: -218, y: 172, content: "Bunker" },
				{ type: "callout", x: -358, y: 361, content: "Stairs" },
				{ type: "callout", x: -134, y: 412, content: "Street" },
				{ type: "callout", x: -72, y: 290, content: "Pit" },
				{ type: "callout", x: -225, y: -160, content: "Window" },
				{ type: "callout", x: -458, y: 126, content: "Goal" },
				{ type: "callout", x: 32, y: -415, content: "Wall" }
			],
			RM: [
				{ type: "callout", x: -182, y: -71, content: "Trench" },
				{ type: "callout", x: -162, y: 9, content: "Cubby" },
				{ type: "callout", x: -2, y: -2, content: "Mid" },
				{ type: "callout", x: -7, y: -191, content: "Wing" },
				{ type: "callout", x: -187, y: -352, content: "Elbow" },
				{ type: "callout", x: -337, y: -218, content: "Plat" },
				{ type: "callout", x: -468, y: -237, content: "Foam Pit" },
				{ type: "callout", x: -619, y: -49, content: "Spawn" },
				{ type: "callout", x: -505, y: -98, content: "Slick" },
				{ type: "callout", x: -318, y: 85, content: "Court" },
				{ type: "callout", x: -218, y: 172, content: "Bunker" },
				{ type: "callout", x: -358, y: 361, content: "Stairs" },
				{ type: "callout", x: -134, y: 412, content: "Street" },
				{ type: "callout", x: -72, y: 290, content: "Pit" },
				{ type: "callout", x: -225, y: -160, content: "Window" },
				{ type: "callout", x: -458, y: 126, content: "Goal" },
				{ type: "callout", x: 32, y: -415, content: "Wall" }
			],
			CB: [
				{ type: "callout", x: -182, y: -71, content: "Trench" },
				{ type: "callout", x: -162, y: 9, content: "Cubby" },
				{ type: "callout", x: -2, y: -2, content: "Mid" },
				{ type: "callout", x: -7, y: -191, content: "Wing" },
				{ type: "callout", x: -187, y: -352, content: "Elbow" },
				{ type: "callout", x: -337, y: -218, content: "Plat" },
				{ type: "callout", x: -468, y: -237, content: "Foam Pit" },
				{ type: "callout", x: -619, y: -49, content: "Spawn" },
				{ type: "callout", x: -505, y: -98, content: "Slick" },
				{ type: "callout", x: -318, y: 85, content: "Court" },
				{ type: "callout", x: -218, y: 172, content: "Bunker" },
				{ type: "callout", x: -358, y: 361, content: "Stairs" },
				{ type: "callout", x: -134, y: 412, content: "Street" },
				{ type: "callout", x: -72, y: 290, content: "Pit" },
				{ type: "callout", x: -225, y: -160, content: "Window" },
				{ type: "callout", x: -458, y: 126, content: "Goal" },
				{ type: "callout", x: 32, y: -415, content: "Wall" }
			]
		}
	},
	BarnacleAndDime: {
		name: "Barnacle & Dime",
		alias: ["Barnacle", "Dime", "Shopping", "Barnacle and Dime", "Mall", "BD", "BAD"],
		id: 17,
		minimap: {
			rotation: -25,
			scale: 0.65,
			translate: {
				x: 0,
				y: 0
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: 0, y: 6, content: "Mid" },
				{ type: "callout", x: 90, y: 149, content: "Snipe" },
				{ type: "callout", x: 8, y: 338, content: "Corner" },
				{ type: "callout", x: -181, y: 279, content: "Court" },
				{ type: "callout", x: -321, y: 254, content: "Box" },
				{ type: "callout", x: -243, y: 108, content: "Perch" },
				{ type: "callout", x: -160, y: 11, content: "Street" },
				{ type: "callout", x: -306, y: -7, content: "Drop" },
				{ type: "callout", x: -356, y: 142, content: "Pit" },
				{ type: "callout", x: -497, y: 100, content: "Bunker" },
				{ type: "callout", x: -357, y: 354, content: "Glass" },
				{ type: "callout", x: -423, y: 444, content: "Attic" },
				{ type: "callout", x: -192, y: 435, content: "Lookout" },
				{ type: "callout", x: -616, y: 307, content: "Spawn" },
				{ type: "callout", x: -26, y: 195, content: "Stack" }
			],
			SZ: [
				{ type: "callout", x: 0, y: 6, content: "Mid" },
				{ type: "callout", x: 90, y: 149, content: "Snipe" },
				{ type: "callout", x: 8, y: 338, content: "Corner" },
				{ type: "callout", x: -181, y: 279, content: "Court" },
				{ type: "callout", x: -321, y: 254, content: "Box" },
				{ type: "callout", x: -243, y: 108, content: "Perch" },
				{ type: "callout", x: -160, y: 11, content: "Street" },
				{ type: "callout", x: -306, y: -7, content: "Drop" },
				{ type: "callout", x: -356, y: 142, content: "Pit" },
				{ type: "callout", x: -497, y: 100, content: "Bunker" },
				{ type: "callout", x: -357, y: 354, content: "Glass" },
				{ type: "callout", x: -423, y: 444, content: "Attic" },
				{ type: "callout", x: -192, y: 435, content: "Lookout" },
				{ type: "callout", x: -616, y: 307, content: "Spawn" },
				{ type: "callout", x: -26, y: 195, content: "Stack" }
			],
			TC: [
				{ type: "callout", x: 0, y: 6, content: "Mid" },
				{ type: "callout", x: 90, y: 149, content: "Snipe" },
				{ type: "callout", x: 8, y: 338, content: "Corner" },
				{ type: "callout", x: -181, y: 279, content: "Court" },
				{ type: "callout", x: -321, y: 254, content: "Box" },
				{ type: "callout", x: -243, y: 108, content: "Perch" },
				{ type: "callout", x: -160, y: 11, content: "Street" },
				{ type: "callout", x: -306, y: -7, content: "Drop" },
				{ type: "callout", x: -356, y: 142, content: "Pit" },
				{ type: "callout", x: -497, y: 100, content: "Bunker" },
				{ type: "callout", x: -357, y: 354, content: "Glass" },
				{ type: "callout", x: -423, y: 444, content: "Attic" },
				{ type: "callout", x: -192, y: 435, content: "Lookout" },
				{ type: "callout", x: -616, y: 307, content: "Spawn" },
				{ type: "callout", x: -26, y: 195, content: "Stack" }
			],
			RM: [
				{ type: "callout", x: 0, y: 6, content: "Mid" },
				{ type: "callout", x: 90, y: 149, content: "Snipe" },
				{ type: "callout", x: 8, y: 338, content: "Corner" },
				{ type: "callout", x: -181, y: 279, content: "Court" },
				{ type: "callout", x: -321, y: 254, content: "Box" },
				{ type: "callout", x: -243, y: 108, content: "Perch" },
				{ type: "callout", x: -160, y: 11, content: "Street" },
				{ type: "callout", x: -306, y: -7, content: "Drop" },
				{ type: "callout", x: -356, y: 142, content: "Pit" },
				{ type: "callout", x: -497, y: 100, content: "Bunker" },
				{ type: "callout", x: -472, y: 162, content: "Steps" },
				{ type: "callout", x: -357, y: 354, content: "Glass" },
				{ type: "callout", x: -423, y: 444, content: "Attic" },
				{ type: "callout", x: -192, y: 435, content: "Lookout" },
				{ type: "callout", x: -758, y: 223, content: "Spawn" },
				{ type: "callout", x: -616, y: 307, content: "Goal" },
				{ type: "callout", x: -26, y: 195, content: "Stack" }
			],
			CB: [
				{ type: "callout", x: 0, y: 6, content: "Mid" },
				{ type: "callout", x: 90, y: 149, content: "Snipe" },
				{ type: "callout", x: 8, y: 338, content: "Corner" },
				{ type: "callout", x: -181, y: 279, content: "Court" },
				{ type: "callout", x: -243, y: 108, content: "Perch" },
				{ type: "callout", x: -160, y: 11, content: "Street" },
				{ type: "callout", x: -306, y: -7, content: "Drop" },
				{ type: "callout", x: -356, y: 142, content: "Pit" },
				{ type: "callout", x: -497, y: 100, content: "Bunker" },
				{ type: "callout", x: -357, y: 354, content: "Glass" },
				{ type: "callout", x: -423, y: 444, content: "Attic" },
				{ type: "callout", x: -192, y: 435, content: "Lookout" },
				{ type: "callout", x: -616, y: 307, content: "Spawn" },
				{ type: "callout", x: -26, y: 195, content: "Stack" }
			]
		}
	},
	CrablegCapital: {
		name: "Crableg Capital",
		alias: ["Crableg", "Skyscraper", "Crab", "Capital", "CC", "CLC"],
		id: 18,
		minimap: {
			rotation: -65,
			scale: 0.67,
			translate: {
				x: 30,
				y: -20
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -294, y: -430, content: "Perch" },
				{ type: "callout", x: -12, y: -296, content: "Elbow" },
				{ type: "callout", x: -200, y: -270, content: "Bridge" },
				{ type: "callout", x: -402, y: -155, content: "Plat" },
				{ type: "callout", x: 20, y: -59, content: "Top Mid" },
				{ type: "callout", x: -4, y: 5, content: "Mid" },
				{ type: "callout", x: -286, y: 86, content: "Drop" },
				{ type: "callout", x: -419, y: 34, content: "Nest" },
				{ type: "callout", x: -544, y: -259, content: "Spawn" },
				{ type: "callout", x: -150, y: -160, content: "Barrel" },
				{ type: "callout", x: 107, y: -215, content: "Pit" },
				{ type: "callout", x: -224, y: -35, content: "Snipe" },
				{ type: "callout", x: -143, y: 45, content: "Court" },
				{ type: "callout", x: 11, y: -180, content: "Grates" }
			],
			SZ: [
				{ type: "callout", x: -294, y: -430, content: "Perch" },
				{ type: "callout", x: -12, y: -296, content: "Elbow" },
				{ type: "callout", x: -200, y: -270, content: "Bridge" },
				{ type: "callout", x: -402, y: -155, content: "Plat" },
				{ type: "callout", x: 20, y: -59, content: "Top Mid" },
				{ type: "callout", x: -4, y: 5, content: "Mid" },
				{ type: "callout", x: -286, y: 86, content: "Drop" },
				{ type: "callout", x: -419, y: 34, content: "Nest" },
				{ type: "callout", x: -544, y: -259, content: "Spawn" },
				{ type: "callout", x: -150, y: -160, content: "Barrel" },
				{ type: "callout", x: 107, y: -215, content: "Pit" },
				{ type: "callout", x: -224, y: -35, content: "Snipe" },
				{ type: "callout", x: -143, y: 45, content: "Court" },
				{ type: "callout", x: 11, y: -180, content: "Grates" }
			],
			TC: [
				{ type: "callout", x: -294, y: -430, content: "Perch" },
				{ type: "callout", x: -12, y: -296, content: "Elbow" },
				{ type: "callout", x: -200, y: -270, content: "Bridge" },
				{ type: "callout", x: -402, y: -155, content: "Plat" },
				{ type: "callout", x: 20, y: -59, content: "Top Mid" },
				{ type: "callout", x: -4, y: 5, content: "Mid" },
				{ type: "callout", x: -286, y: 86, content: "Drop" },
				{ type: "callout", x: -419, y: 34, content: "Nest" },
				{ type: "callout", x: -544, y: -259, content: "Spawn" },
				{ type: "callout", x: -150, y: -160, content: "Barrel" },
				{ type: "callout", x: 107, y: -215, content: "Pit" },
				{ type: "callout", x: -224, y: -35, content: "Snipe" },
				{ type: "callout", x: -143, y: 45, content: "Court" }
			],
			RM: [
				{ type: "callout", x: -294, y: -430, content: "Perch" },
				{ type: "callout", x: -12, y: -296, content: "Elbow" },
				{ type: "callout", x: -200, y: -270, content: "Bridge" },
				{ type: "callout", x: -402, y: -155, content: "Plat" },
				{ type: "callout", x: 20, y: -59, content: "Top Mid" },
				{ type: "callout", x: -4, y: 5, content: "Mid" },
				{ type: "callout", x: -286, y: 86, content: "Drop" },
				{ type: "callout", x: -419, y: 34, content: "Nest" },
				{ type: "callout", x: -544, y: -259, content: "Spawn" },
				{ type: "callout", x: -150, y: -160, content: "Barrel" },
				{ type: "callout", x: 107, y: -215, content: "Pit" },
				{ type: "callout", x: -224, y: -35, content: "Snipe" },
				{ type: "callout", x: -143, y: 45, content: "Court" },
				{ type: "callout", x: 11, y: -180, content: "Grates" }
			],
			CB: [
				{ type: "callout", x: -294, y: -430, content: "Perch" },
				{ type: "callout", x: -12, y: -296, content: "Elbow" },
				{ type: "callout", x: -200, y: -270, content: "Bridge" },
				{ type: "callout", x: -402, y: -155, content: "Plat" },
				{ type: "callout", x: 20, y: -59, content: "Top Mid" },
				{ type: "callout", x: -4, y: 5, content: "Mid" },
				{ type: "callout", x: -286, y: 86, content: "Drop" },
				{ type: "callout", x: -419, y: 34, content: "Nest" },
				{ type: "callout", x: -544, y: -259, content: "Spawn" },
				{ type: "callout", x: -180, y: -130, content: "Ramp" },
				{ type: "callout", x: 107, y: -215, content: "Pit" },
				{ type: "callout", x: -224, y: -35, content: "Snipe" },
				{ type: "callout", x: -143, y: 45, content: "Court" },
				{ type: "callout", x: 11, y: -180, content: "Grates" }
			]
		}
	},
	ShipshapeCargoCo: {
		name: "Shipshape Cargo Co.",
		alias: ["Shipshape", "Cargo", "SC", "SCC"],
		id: 19,
		minimap: {
			rotation: -40,
			scale: 0.55,
			translate: {
				x: 0,
				y: -20
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: 2, y: -164, content: "Left Mid" },
				{ type: "callout", x: 0, y: 167, content: "Right Mid" },
				{ type: "callout", x: -121, y: 155, content: "Ramp" },
				{ type: "callout", x: 0, y: -1, content: "Mid" },
				{ type: "callout", x: -278, y: -17, content: "Court" },
				{ type: "callout", x: -299, y: 205, content: "Pit" },
				{ type: "callout", x: -101, y: 359, content: "Sneaky" },
				{ type: "callout", x: -431, y: 374, content: "Sponge" },
				{ type: "callout", x: -672, y: 378, content: "Lookout" },
				{ type: "callout", x: -480, y: 200, content: "Plat" },
				{ type: "callout", x: -482, y: -179, content: "Snipe" },
				{ type: "callout", x: -465, y: 50, content: "Trench" },
				{ type: "callout", x: -675, y: 18, content: "Drop" },
				{ type: "callout", x: -829, y: 23, content: "Spawn" }
			],
			SZ: [
				{ type: "callout", x: 2, y: -164, content: "Left Mid" },
				{ type: "callout", x: 0, y: 167, content: "Right Mid" },
				{ type: "callout", x: -121, y: 155, content: "Ramp" },
				{ type: "callout", x: 0, y: -1, content: "Mid" },
				{ type: "callout", x: -278, y: -17, content: "Court" },
				{ type: "callout", x: -299, y: 205, content: "Pit" },
				{ type: "callout", x: -101, y: 359, content: "Sneaky" },
				{ type: "callout", x: -431, y: 374, content: "Sponge" },
				{ type: "callout", x: -672, y: 378, content: "Lookout" },
				{ type: "callout", x: -480, y: 110, content: "Plat" },
				{ type: "callout", x: -482, y: -179, content: "Snipe" },
				{ type: "callout", x: -465, y: 5, content: "Trench" },
				{ type: "callout", x: -675, y: 18, content: "Drop" },
				{ type: "callout", x: -829, y: 23, content: "Spawn" }
			],
			TC: [
				{ type: "callout", x: 2, y: -164, content: "Left Mid" },
				{ type: "callout", x: 0, y: 167, content: "Right Mid" },
				{ type: "callout", x: -121, y: 155, content: "Ramp" },
				{ type: "callout", x: 0, y: -1, content: "Mid" },
				{ type: "callout", x: -278, y: -17, content: "Court" },
				{ type: "callout", x: -299, y: 205, content: "Pit" },
				{ type: "callout", x: -180, y: 359, content: "Sneaky" },
				{ type: "callout", x: -431, y: 374, content: "Sponge" },
				{ type: "callout", x: -672, y: 378, content: "Lookout" },
				{ type: "callout", x: -480, y: 110, content: "Plat" },
				{ type: "callout", x: -482, y: -179, content: "Snipe" },
				{ type: "callout", x: -465, y: 5, content: "Trench" },
				{ type: "callout", x: -675, y: 18, content: "Drop" },
				{ type: "callout", x: -829, y: 23, content: "Spawn" },
				{ type: "callout", x: -299, y: 271, content: "Bridge" },
				{ type: "callout", x: -120, y: -258, content: "Elbow" }
			],
			RM: [
				{ type: "callout", x: 2, y: -164, content: "Left Mid" },
				{ type: "callout", x: 0, y: 167, content: "Right Mid" },
				{ type: "callout", x: -121, y: 155, content: "Ramp" },
				{ type: "callout", x: 0, y: -1, content: "Mid" },
				{ type: "callout", x: -278, y: -17, content: "Court" },
				{ type: "callout", x: -299, y: 205, content: "Pit" },
				{ type: "callout", x: -180, y: 359, content: "Sneaky" },
				{ type: "callout", x: -431, y: 374, content: "Sponge" },
				{ type: "callout", x: -672, y: 378, content: "Lookout" },
				{ type: "callout", x: -480, y: 110, content: "Plat" },
				{ type: "callout", x: -482, y: -179, content: "Snipe" },
				{ type: "callout", x: -465, y: 5, content: "Trench" },
				{ type: "callout", x: -675, y: 18, content: "Goal" },
				{ type: "callout", x: -829, y: 23, content: "Spawn" },
				{ type: "callout", x: -299, y: 271, content: "Bridge" },
				{ type: "callout", x: -120, y: -258, content: "Elbow" }
			],
			CB: [
				{ type: "callout", x: 2, y: -164, content: "Left Mid" },
				{ type: "callout", x: 0, y: 167, content: "Right Mid" },
				{ type: "callout", x: -121, y: 155, content: "Ramp" },
				{ type: "callout", x: 0, y: -1, content: "Mid" },
				{ type: "callout", x: -278, y: -17, content: "Court" },
				{ type: "callout", x: -299, y: 205, content: "Pit" },
				{ type: "callout", x: -180, y: 359, content: "Sneaky" },
				{ type: "callout", x: -431, y: 374, content: "Sponge" },
				{ type: "callout", x: -672, y: 378, content: "Lookout" },
				{ type: "callout", x: -480, y: 110, content: "Plat" },
				{ type: "callout", x: -482, y: -179, content: "Snipe" },
				{ type: "callout", x: -465, y: 5, content: "Trench" },
				{ type: "callout", x: -675, y: 18, content: "Drop" },
				{ type: "callout", x: -829, y: 23, content: "Spawn" },
				{ type: "callout", x: -299, y: 271, content: "Bridge" }
			]
		}
	},
	BluefinDepot: {
		name: "Bluefin Depot",
		alias: ["Bluefin", "Depot", "BF", "BFD"],
		id: 20,
		minimap: {
			rotation: -42,
			scale: 0.55,
			translate: {
				x: 0,
				y: 0
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -387, y: -236, content: "Sandbags" },
				{ type: "callout", x: 0, y: 191, content: "Cross" },
				{ type: "callout", x: -131, y: 18, content: "Ramp" },
				{ type: "callout", x: -165, y: -189, content: "Flank Drop" },
				{ type: "callout", x: -227, y: -86, content: "Left Lift" },
				{ type: "callout", x: -369, y: -28, content: "Planks" },
				{ type: "callout", x: -201, y: 291, content: "Right Wall" },
				{ type: "callout", x: -290, y: 356, content: "Right Closed" },
				{ type: "callout", x: -210, y: 197, content: "Drop" },
				{ type: "callout", x: -225, y: 93, content: "Right Lift" },
				{ type: "callout", x: -384, y: 151, content: "Plat" },
				{ type: "callout", x: -545, y: -46, content: "Rock" },
				{ type: "callout", x: -650, y: 137, content: "Spawn" }
			],
			SZ: [
				{ type: "callout", x: -387, y: -236, content: "Sandbags" },
				{ type: "callout", x: 2, y: 2, content: "Zone" },
				{ type: "callout", x: 0, y: 191, content: "Cross" },
				{ type: "callout", x: -131, y: 18, content: "Ramp" },
				{ type: "callout", x: -165, y: -189, content: "Flank Drop" },
				{ type: "callout", x: -227, y: -86, content: "Left Lift" },
				{ type: "callout", x: -369, y: -28, content: "Planks" },
				{ type: "callout", x: -201, y: 291, content: "Right Wall" },
				{ type: "callout", x: -290, y: 356, content: "Right Closed" },
				{ type: "callout", x: -210, y: 197, content: "Drop" },
				{ type: "callout", x: -225, y: 93, content: "Right Lift" },
				{ type: "callout", x: -384, y: 151, content: "Plat" },
				{ type: "callout", x: -545, y: -46, content: "Rock" },
				{ type: "callout", x: -650, y: 137, content: "Spawn" },
				{ type: "callout", x: -182, y: -277, content: "Left Wall" },
				{ type: "callout", x: -335, y: -353, content: "Left Closed" }
			],
			TC: [
				{ type: "callout", x: -387, y: -236, content: "Sandbags" },
				{ type: "callout", x: 2, y: 2, content: "Mid" },
				{ type: "callout", x: 0, y: 191, content: "Cross" },
				{ type: "callout", x: -131, y: 18, content: "Ramp" },
				{ type: "callout", x: -165, y: -189, content: "Flank Drop" },
				{ type: "callout", x: -227, y: -86, content: "Left Lift" },
				{ type: "callout", x: -369, y: -28, content: "Planks" },
				{ type: "callout", x: -201, y: 291, content: "Right Wall" },
				{ type: "callout", x: -290, y: 356, content: "Right Closed" },
				{ type: "callout", x: -210, y: 197, content: "Drop" },
				{ type: "callout", x: -225, y: 93, content: "Right Lift" },
				{ type: "callout", x: -384, y: 151, content: "Plat" },
				{ type: "callout", x: -545, y: -46, content: "Rock" },
				{ type: "callout", x: -650, y: 137, content: "Spawn" }
			],
			RM: [
				{ type: "callout", x: -387, y: -236, content: "Sandbags" },
				{ type: "callout", x: 2, y: 2, content: "Mid" },
				{ type: "callout", x: 0, y: 191, content: "Cross" },
				{ type: "callout", x: -131, y: 18, content: "Ramp" },
				{ type: "callout", x: -165, y: -189, content: "Flank Drop" },
				{ type: "callout", x: -227, y: -86, content: "Left Lift" },
				{ type: "callout", x: -369, y: -28, content: "Planks" },
				{ type: "callout", x: -201, y: 291, content: "Right Wall" },
				{ type: "callout", x: -290, y: 356, content: "Right Closed" },
				{ type: "callout", x: -210, y: 197, content: "Drop" },
				{ type: "callout", x: -225, y: 93, content: "Right Lift" },
				{ type: "callout", x: -384, y: 151, content: "Plat" },
				{ type: "callout", x: -545, y: -46, content: "Rock" },
				{ type: "callout", x: -650, y: 137, content: "Goal" },
				{ type: "callout", x: -182, y: -277, content: "Left Wall" },
				{ type: "callout", x: -335, y: -353, content: "Left Closed" },
				{ type: "callout", x: -875, y: 120, content: "Spawn" }
			],
			CB: [
				{ type: "callout", x: -387, y: -236, content: "Sandbags" },
				{ type: "callout", x: 2, y: 2, content: "Mid" },
				{ type: "callout", x: 0, y: 191, content: "Cross" },
				{ type: "callout", x: -131, y: 18, content: "Ramp" },
				{ type: "callout", x: -165, y: -189, content: "Flank Drop" },
				{ type: "callout", x: -227, y: -86, content: "Left Lift" },
				{ type: "callout", x: -369, y: -28, content: "Planks" },
				{ type: "callout", x: -201, y: 291, content: "Right Wall" },
				{ type: "callout", x: -290, y: 356, content: "Right Closed" },
				{ type: "callout", x: -210, y: 197, content: "Drop" },
				{ type: "callout", x: -225, y: 93, content: "Right Lift" },
				{ type: "callout", x: -384, y: 151, content: "Plat" },
				{ type: "callout", x: -545, y: -46, content: "Rock" },
				{ type: "callout", x: -650, y: 137, content: "Spawn" },
				{ type: "callout", x: -182, y: -277, content: "Left Wall" },
				{ type: "callout", x: -335, y: -353, content: "Left Closed" }
			]
		}
	},
	RoboRomEn: {
		name: "Robo ROM-en",
		alias: ["Ramen", "ROMen", "Robo", "ROM-en", "Robo Ramen", "RR", "ROB"],
		id: 21,
		minimap: {
			rotation: -30,
			scale: 0.65,
			translate: {
				x: 0,
				y: 20
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -272, y: -5, content: "Court" },
				{ type: "callout", x: -509, y: -47, content: "Long" },
				{ type: "callout", x: -641, y: 281, content: "Spawn" },
				{ type: "callout", x: -386, y: 233, content: "Drop" },
				{ type: "callout", x: -259, y: 222, content: "Choke" },
				{ type: "callout", x: -72, y: 314, content: "Sneaky" },
				{ type: "callout", x: 30, y: 190, content: "Elbow" },
				{ type: "callout", x: -107, y: 186, content: "Street" },
				{ type: "callout", x: 0, y: 0, content: "Mid" },
				{ type: "callout", x: -181, y: 11, content: "Wall" },
				{ type: "callout", x: -110, y: -80, content: "Ramp" },
				{ type: "callout", x: -315, y: 100, content: "Snipe" }
			],
			SZ: [
				{ type: "callout", x: -272, y: -5, content: "Court" },
				{ type: "callout", x: -509, y: -47, content: "Long" },
				{ type: "callout", x: -641, y: 281, content: "Spawn" },
				{ type: "callout", x: -386, y: 233, content: "Drop" },
				{ type: "callout", x: -259, y: 222, content: "Choke" },
				{ type: "callout", x: -72, y: 314, content: "Sneaky" },
				{ type: "callout", x: 30, y: 190, content: "Elbow" },
				{ type: "callout", x: -107, y: 186, content: "Street" },
				{ type: "callout", x: 0, y: 0, content: "Mid" },
				{ type: "callout", x: -181, y: 11, content: "Wall" },
				{ type: "callout", x: -110, y: -80, content: "Ramp" },
				{ type: "callout", x: -315, y: 100, content: "Snipe" }
			],
			TC: [
				{ type: "callout", x: -272, y: -5, content: "Court" },
				{ type: "callout", x: -509, y: -47, content: "Long" },
				{ type: "callout", x: -641, y: 281, content: "Spawn" },
				{ type: "callout", x: -386, y: 233, content: "Drop" },
				{ type: "callout", x: -220, y: 210, content: "Trench" },
				{ type: "callout", x: -72, y: 314, content: "Sneaky" },
				{ type: "callout", x: 30, y: 190, content: "Elbow" },
				{ type: "callout", x: -107, y: 186, content: "Street" },
				{ type: "callout", x: 0, y: 0, content: "Mid" },
				{ type: "callout", x: -181, y: 11, content: "Wall" },
				{ type: "callout", x: -110, y: -80, content: "Ramp" },
				{ type: "callout", x: -315, y: 100, content: "Snipe" }
			],
			RM: [
				{ type: "callout", x: -272, y: -5, content: "Court" },
				{ type: "callout", x: -509, y: -47, content: "Long" },
				{ type: "callout", x: -641, y: 281, content: "Spawn" },
				{ type: "callout", x: -386, y: 233, content: "Drop" },
				{ type: "callout", x: -259, y: 222, content: "Choke" },
				{ type: "callout", x: -72, y: 314, content: "Sneaky" },
				{ type: "callout", x: 30, y: 190, content: "Elbow" },
				{ type: "callout", x: -107, y: 186, content: "Street" },
				{ type: "callout", x: 0, y: 0, content: "Mid" },
				{ type: "callout", x: -181, y: 11, content: "Wall" },
				{ type: "callout", x: -110, y: -80, content: "Ramp" },
				{ type: "callout", x: -315, y: 100, content: "Snipe" },
				{ type: "callout", x: -578, y: 211, content: "Goal" },
				{ type: "callout", x: 4, y: 255, content: "Grates" }
			],
			CB: [
				{ type: "callout", x: -272, y: -5, content: "Court" },
				{ type: "callout", x: -509, y: -47, content: "Long" },
				{ type: "callout", x: -641, y: 281, content: "Spawn" },
				{ type: "callout", x: -386, y: 233, content: "Drop" },
				{ type: "callout", x: -259, y: 222, content: "Choke" },
				{ type: "callout", x: -72, y: 314, content: "Sneaky" },
				{ type: "callout", x: 30, y: 190, content: "Elbow" },
				{ type: "callout", x: -107, y: 186, content: "Street" },
				{ type: "callout", x: 0, y: 0, content: "Mid" },
				{ type: "callout", x: -181, y: 11, content: "Wall" },
				{ type: "callout", x: -110, y: -80, content: "Ramp" },
				{ type: "callout", x: -315, y: 100, content: "Snipe" },
				{ type: "callout", x: 4, y: 255, content: "Grates" }
			]
		}
	},
	MarlinAirport: {
		name: "Marlin Airport",
		alias: ["Marlin", "Airport", "Plane", "MA", "AIR"],
		id: 22,
		minimap: {
			rotation: -12,
			scale: 0.7,
			translate: {
				x: 0,
				y: -25
			}
		},
		gamemodes: {
			TW: [
				{ type: "callout", x: -492, y: 367, content: "Spawn" },
				{ type: "callout", x: -353, y: 259, content: "Slick" },
				{ type: "callout", x: -255, y: 286, content: "Lookout" },
				{ type: "callout", x: -161, y: 274, content: "Window" },
				{ type: "callout", x: 0, y: 237, content: "Ditch" },
				{ type: "callout", x: -4, y: 9, content: "Mid" },
				{ type: "callout", x: -126, y: 152, content: "Grate" },
				{ type: "callout", x: -152, y: 195, content: "Alley" },
				{ type: "callout", x: -527, y: 193, content: "Bridge" },
				{ type: "callout", x: -600, y: 107, content: "Rail" },
				{ type: "callout", x: -423, y: 123, content: "Pit" },
				{ type: "callout", x: -298, y: 78, content: "Plat" },
				{ type: "callout", x: -157, y: 64, content: "Fan" },
				{ type: "callout", x: -185, y: -54, content: "Drop" },
				{ type: "callout", x: -161, y: -161, content: "Zoom" },
				{ type: "callout", x: -440, y: -11, content: "Snipe" }
			],
			SZ: [
				{ type: "callout", x: -492, y: 367, content: "Spawn" },
				{ type: "callout", x: -353, y: 259, content: "Slick" },
				{ type: "callout", x: -255, y: 286, content: "Lookout" },
				{ type: "callout", x: -161, y: 274, content: "Window" },
				{ type: "callout", x: 0, y: 237, content: "Ditch" },
				{ type: "callout", x: -4, y: 9, content: "Mid" },
				{ type: "callout", x: -126, y: 152, content: "Grate" },
				{ type: "callout", x: -152, y: 195, content: "Alley" },
				{ type: "callout", x: -527, y: 193, content: "Bridge" },
				{ type: "callout", x: -600, y: 107, content: "Rail" },
				{ type: "callout", x: -423, y: 123, content: "Pit" },
				{ type: "callout", x: -298, y: 78, content: "Plat" },
				{ type: "callout", x: -157, y: 64, content: "Fan" },
				{ type: "callout", x: -185, y: -54, content: "Drop" },
				{ type: "callout", x: -161, y: -161, content: "Zoom" },
				{ type: "callout", x: -440, y: -11, content: "Snipe" }
			],
			TC: [
				{ type: "callout", x: -492, y: 367, content: "Spawn" },
				{ type: "callout", x: -255, y: 286, content: "Lookout" },
				{ type: "callout", x: -161, y: 274, content: "Window" },
				{ type: "callout", x: 0, y: 237, content: "Ditch" },
				{ type: "callout", x: -4, y: 9, content: "Mid" },
				{ type: "callout", x: -126, y: 152, content: "Grate" },
				{ type: "callout", x: -152, y: 195, content: "Alley" },
				{ type: "callout", x: -543, y: 170, content: "Bridge" },
				{ type: "callout", x: -600, y: 107, content: "Rail" },
				{ type: "callout", x: -423, y: 123, content: "Pit" },
				{ type: "callout", x: -298, y: 78, content: "Plat" },
				{ type: "callout", x: -157, y: 64, content: "Fan" },
				{ type: "callout", x: -185, y: -54, content: "Drop" },
				{ type: "callout", x: -161, y: -161, content: "Zoom" },
				{ type: "callout", x: -440, y: -11, content: "Snipe" },
				{ type: "callout", x: -498, y: 208, content: "Goal" }
			],
			RM: [
				{ type: "callout", x: -492, y: 367, content: "Spawn" },
				{ type: "callout", x: -353, y: 259, content: "Slick" },
				{ type: "callout", x: -255, y: 286, content: "Lookout" },
				{ type: "callout", x: -161, y: 274, content: "Window" },
				{ type: "callout", x: 0, y: 237, content: "Ditch" },
				{ type: "callout", x: -4, y: 9, content: "Mid" },
				{ type: "callout", x: -126, y: 152, content: "Grate" },
				{ type: "callout", x: -152, y: 195, content: "Alley" },
				{ type: "callout", x: -527, y: 193, content: "Bridge" },
				{ type: "callout", x: -600, y: 107, content: "Rail" },
				{ type: "callout", x: -423, y: 123, content: "Pit" },
				{ type: "callout", x: -298, y: 78, content: "Plat" },
				{ type: "callout", x: -157, y: 64, content: "Fan" },
				{ type: "callout", x: -185, y: -54, content: "Drop" },
				{ type: "callout", x: -161, y: -161, content: "Zoom" },
				{ type: "callout", x: -440, y: -11, content: "Snipe" },
				{ type: "callout", x: -299, y: -77, content: "Sneaky" },
				{ type: "callout", x: -461, y: 289, content: "Goal" }
			],
			CB: [
				{ type: "callout", x: -492, y: 367, content: "Spawn" },
				{ type: "callout", x: -353, y: 259, content: "Slick" },
				{ type: "callout", x: -255, y: 286, content: "Lookout" },
				{ type: "callout", x: -161, y: 274, content: "Window" },
				{ type: "callout", x: 0, y: 237, content: "Ditch" },
				{ type: "callout", x: -4, y: 9, content: "Mid" },
				{ type: "callout", x: -126, y: 152, content: "Grate" },
				{ type: "callout", x: -152, y: 195, content: "Alley" },
				{ type: "callout", x: -527, y: 193, content: "Bridge" },
				{ type: "callout", x: -600, y: 107, content: "Rail" },
				{ type: "callout", x: -423, y: 123, content: "Pit" },
				{ type: "callout", x: -298, y: 78, content: "Plat" },
				{ type: "callout", x: -157, y: 64, content: "Fan" },
				{ type: "callout", x: -185, y: -54, content: "Drop" },
				{ type: "callout", x: -161, y: -161, content: "Zoom" },
				{ type: "callout", x: -440, y: -11, content: "Snipe" },
				{ type: "callout", x: -299, y: -77, content: "Sneaky" }
			]
		}
	},
	LemuriaHub: {
		name: "Lemuria Hub",
		alias: ["Lemuria", "Lumeria", "Train", "LH", "LEM"],
		id: 23,
		minimap: {
			rotation: 0,
			scale: 1,
			translate: {
				x: 0,
				y: 0
			}
		},
		gamemodes: {
			TW: [{ type: "callout", x: 0, y: 0, content: "Callouts not known" }],
			SZ: [{ type: "callout", x: 0, y: 0, content: "Callouts not known" }],
			TC: [{ type: "callout", x: 0, y: 0, content: "Callouts not known" }],
			RM: [{ type: "callout", x: 0, y: 0, content: "Callouts not known" }],
			CB: [{ type: "callout", x: 0, y: 0, content: "Callouts not known" }]
		}
	}
} as const satisfies AllLocations;
export type MapName = keyof typeof LOCATIONS;
export function isMapName(t: unknown): t is MapName {
	return typeof t === "string" && t in LOCATIONS;
}

export function encodeCanvas(stage: MapName | number, gamemode: Gamemode): number {
	if (typeof stage === "string") {
		stage = LOCATIONS[stage].id;
	}
	const gamemodeId = GAMEMODES.indexOf(gamemode);
	return (stage << 3) | gamemodeId;
}
export function decodeCanvas(canvas: number): { stage: MapName; gamemode: Gamemode } {
	const stageId = canvas >> 3;
	const gamemodeId = canvas & 0b111;
	const gamemode = GAMEMODES[gamemodeId] ?? "TW";
	const stage = (Object.entries(LOCATIONS).find(([, { id }]) => id === stageId)?.[0] ??
		"ScorchGorge") as MapName;
	return { stage, gamemode };
}

// Make sure each alias is unique
const aliases = new Set<string>([
	// These are commonly used, make sure they arent reused accidentally.
	// It would be confusing to see, e.g. 'SZ CB' to refer to Splat Zones Crableg after all!
	"TW",
	"SZ",
	"TC",
	"RM",
	"CB",
	"Turf",
	"Zones",
	"Tower",
	"Rainmaker",
	"Clams"
]);
// Generate a command palette for locations too
export const locationCommandPalette: Array<{
	key: `${"map" | "tw" | "sz" | "tc" | "rm" | "cb"}-${MapName}`;
	name: string;
	desc: string;
	alias: Array<string>;
}> = [];
for (const [key, location] of Object.entries(LOCATIONS) as Array<
	[MapName, (typeof LOCATIONS)[MapName]]
>) {
	for (const alias of location.alias) {
		if (aliases.has(alias)) {
			throw new Error(`Alias is reused: '${alias}' in ${location.name}`);
		}
		aliases.add(alias);
	}

	locationCommandPalette.push(
		{
			key: `map-${key}`,
			name: `Switch to ${location.name}`,
			desc: `Change the current map to ${location.name}`,
			alias: location.alias
		},
		{
			key: `tw-${key}`,
			name: `Switch to Turf War on ${location.name}`,
			desc: `Change the current map to ${location.name} on the Turf War gamemode.`,
			alias: location.alias.flatMap((alias) => [
				`TW ${alias}`,
				`Turf ${alias}`,
				`Turf War ${alias}`,
				`TW${alias}`,
				`${alias}TW`,
				`${alias} TW`,
				`${alias} Turf`,
				`${alias} Turf War`
			])
		},
		{
			key: `sz-${key}`,
			name: `Switch to Splat Zones on ${location.name}`,
			desc: `Change the current map to ${location.name} on the Splat Zones gamemode.`,
			alias: location.alias.flatMap((alias) => [
				`SZ ${alias}`,
				`Zones ${alias}`,
				`Splat Zones ${alias}`,
				`SZ${alias}`,
				`${alias}SZ`,
				`${alias} SZ`,
				`${alias} Zones`,
				`${alias} Splat Zones`
			])
		},
		{
			key: `tc-${key}`,
			name: `Switch to Tower Control on ${location.name}`,
			desc: `Change the current map to ${location.name} on the Tower Control gamemode.`,
			alias: location.alias.flatMap((alias) => [
				`TC ${alias}`,
				`Tower ${alias}`,
				`Tower Control ${alias}`,
				`TC${alias}`,
				`${alias}TC`,
				`${alias} TC`,
				`${alias} Tower`,
				`${alias} Tower Control`
			])
		},
		{
			key: `rm-${key}`,
			name: `Switch to Rainmaker on ${location.name}`,
			desc: `Change the current map to ${location.name} on the Rainmaker gamemode.`,
			alias: location.alias.flatMap((alias) => [
				`RM ${alias}`,
				`Rain ${alias}`,
				`Rainmaker ${alias}`,
				`RM${alias}`,
				`${alias}RM`,
				`${alias} RM`,
				`${alias} Rain`,
				`${alias} Rainmaker`
			])
		},
		{
			key: `cb-${key}`,
			name: `Switch to Clam Blitz on ${location.name}`,
			desc: `Change the current map to ${location.name} on the Clam Blitz gamemode.`,
			alias: location.alias.flatMap((alias) => [
				`CB ${alias}`,
				`Clams ${alias}`,
				`Clam Blitz ${alias}`,
				`CB${alias}`,
				`${alias}CB`,
				`${alias} CB`,
				`${alias} Clams`,
				`${alias} Clam Blitz`
			])
		}
	);
}
