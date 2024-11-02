// APCA 0.0.98G
// https://github.com/Myndex/apca-w3
// see also https://github.com/w3c/silver/issues/643

// exponents
const normBG = 0.56;
const normTXT = 0.57;
const revTXT = 0.62;
const revBG = 0.65;

// clamps
const blkThrs = 0.022;
const blkClmp = 1.414;
const loClip = 0.1;
const deltaYmin = 0.0005;

// scalers
// see https://github.com/w3c/silver/issues/645
const scaleBoW = 1.14;
const loBoWoffset = 0.027;
const scaleWoB = 1.14;
const loWoBoffset = 0.027;

function fclamp(Y: number) {
	if (Y >= blkThrs) {
		return Y;
	}
	return Y + (blkThrs - Y) ** blkClmp;
}

function linearize(val: number) {
	const sign = val < 0 ? -1 : 1;
	const abs = Math.abs(val);
	return sign * Math.pow(abs, 2.4);
}

export function contrastAPCA(
	background: [r: number, g: number, b: number],
	foreground: [r: number, g: number, b: number]
) {
	// Myndex as-published, assumes sRGB inputs
	// Calculates "screen luminance" with non-standard simple gamma EOTF
	// weights should be from CSS Color 4, not the ones here which are via Myndex and copied from Lindbloom
	const lumTxt =
		linearize(foreground[0]) * 0.2126729 +
		linearize(foreground[1]) * 0.7151522 +
		linearize(foreground[2]) * 0.072175;

	const lumBg =
		linearize(background[0]) * 0.2126729 +
		linearize(background[1]) * 0.7151522 +
		linearize(background[2]) * 0.072175;

	// toe clamping of very dark values to account for flare
	const Ytxt = fclamp(lumTxt);
	const Ybg = fclamp(lumBg);

	// are we "Black on White" (dark on light), or light on dark?
	const BoW = Ybg > Ytxt;

	// why is this a delta, when Y is not perceptually uniform?
	// Answer: it is a noise gate, see
	// https://github.com/LeaVerou/color.js/issues/208
	let C;
	if (Math.abs(Ybg - Ytxt) < deltaYmin) {
		C = 0;
	} else {
		if (BoW) {
			// dark text on light background
			const S = Ybg ** normBG - Ytxt ** normTXT;
			C = S * scaleBoW;
		} else {
			// light text on dark background
			const S = Ybg ** revBG - Ytxt ** revTXT;
			C = S * scaleWoB;
		}
	}

	let Sapc;
	if (Math.abs(C) < loClip) {
		Sapc = 0;
	} else if (C > 0) {
		// not clear whether Woffset is loBoWoffset or loWoBoffset
		// but they have the same value
		Sapc = C - loBoWoffset;
	} else {
		Sapc = C + loBoWoffset;
	}

	return Sapc * 100;
}

function hexToVec(col: string): [r: number, b: number, g: number] {
	col = col.replace("#", "");
	return [
		parseInt(col.substring(0, 2), 16),
		parseInt(col.substring(2, 4), 16),
		parseInt(col.substring(4, 6), 16)
	];
}
export function getHighestContrast(text: string, backgrounds: Array<string>): string {
	const textV = hexToVec(text);

	let highest: string = text;
	let highestValue = 0;
	for (const bg of backgrounds) {
		const contrast = Math.abs(contrastAPCA(hexToVec(bg), textV));
		if (contrast > highestValue) {
			highestValue = contrast;
			highest = bg;
		}
	}

	return highest;
}
