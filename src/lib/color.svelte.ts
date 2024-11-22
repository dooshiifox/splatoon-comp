import { lerp, mod, unreachable } from "albtc";

type Rgb = string;
type RgbNormalised = { r: number; b: number; g: number; a: number };
type RgbComponents = RgbNormalised;
type HsvNormalised = { h: number; s: number; v: number; a: number };

const rgbMatch =
	/^#?(?:(?:(?<r2>[0-9a-f]{2})(?<g2>[0-9a-f]{2})(?<b2>[0-9a-f]{2})(?<a2>[0-9a-f]{2})?)|(?:(?<r1>[0-9a-f])(?<g1>[0-9a-f])(?<b1>[0-9a-f])(?<a1>[0-9a-f])?))$/;
export function getRgbComponents(rgb: string): RgbComponents | undefined {
	const matches = rgbMatch.exec(rgb);
	if (matches === null || matches.groups === undefined) return undefined;

	let rStr = matches.groups["r2"];
	let gStr = matches.groups["g2"];
	let bStr = matches.groups["b2"];
	let aStr = matches.groups["a2"] ?? "ff";
	if (matches.groups["r1"] !== undefined) {
		rStr = matches.groups["r1"] + matches.groups["r1"];
		gStr = matches.groups["g1"] + matches.groups["g1"];
		bStr = matches.groups["b1"] + matches.groups["b1"];
		if (matches.groups["a1"] !== undefined) {
			aStr = matches.groups["a1"] + matches.groups["a1"];
		}
	}

	const r = parseInt(rStr, 16);
	const g = parseInt(gStr, 16);
	const b = parseInt(bStr, 16);
	const a = parseInt(aStr, 16);
	return { r, g, b, a };
}
function normaliseRgb(rgb: string): RgbNormalised | undefined {
	const components = getRgbComponents(rgb);
	if (!components) return;
	return {
		r: components.r / 255,
		g: components.g / 255,
		b: components.b / 255,
		a: components.a / 255
	};
}
function rgbString({ r, g, b, a }: RgbNormalised, alwaysIncludeAlpha = false): Rgb {
	const p = (v: number) =>
		Math.trunc(v * 255)
			.toString(16)
			.padStart(2, "0");
	// If alpha is 1, don't bother including it
	if (a === 1 && !alwaysIncludeAlpha) {
		return `#${p(r)}${p(g)}${p(b)}`;
	}
	return `#${p(r)}${p(g)}${p(b)}${p(a)}`;
}
function rgbToHsv({ r, g, b, a }: RgbNormalised) {
	const maxC = Math.max(r, g, b);
	const minC = Math.min(r, g, b);
	const v = maxC;
	if (minC === maxC) return { h: 0, s: 0, v, a };

	const s = (maxC - minC) / maxC;
	const rC = (maxC - r) / (maxC - minC);
	const gC = (maxC - g) / (maxC - minC);
	const bC = (maxC - b) / (maxC - minC);
	let h;
	if (r === maxC) {
		h = bC - gC;
	} else if (g === maxC) {
		h = 2 + rC - bC;
	} else {
		h = 4 + gC - rC;
	}
	h = mod(h / 6, 1);
	return { h, s, v, a };
}
function hsvToRgb({ h, s, v, a }: HsvNormalised): RgbNormalised {
	if (s === 0) return { r: v, g: v, b: v, a };
	const i = Math.trunc(h * 6);
	const f = h * 6 - i;
	const p = v * (1 - s);
	const q = v * (1 - s * f);
	const t = v * (1 - s * (1 - f));
	switch (mod(i, 6)) {
		case 0:
			return { r: v, g: t, b: p, a };
		case 1:
			return { r: q, g: v, b: p, a };
		case 2:
			return { r: p, g: v, b: t, a };
		case 3:
			return { r: p, g: q, b: v, a };
		case 4:
			return { r: t, g: p, b: v, a };
		case 5:
			return { r: v, g: p, b: q, a };
	}
	unreachable();
}

export class Color {
	#h = $state(0);
	#s = $state(0);
	#v = $state(0);
	#a = $state(1);
	get h() {
		return this.#h;
	}
	set h(val) {
		if (this.#h === val) return;
		this.#h = val;
		this.exactRgb = null;
	}
	get s() {
		return this.#s;
	}
	set s(val) {
		if (this.#s === val) return;
		this.#s = val;
		this.exactRgb = null;
	}
	get v() {
		return this.#v;
	}
	set v(val) {
		if (this.#v === val) return;
		this.#v = val;
		this.exactRgb = null;
	}
	get a() {
		return this.#a;
	}
	set a(val) {
		if (this.#a === val) return;
		this.#a = val;
		this.exactRgb = null;
	}

	#rgb = $derived(rgbString(hsvToRgb(this)));
	private exactRgb = $state<string | null>(null);
	get rgb() {
		return this.exactRgb ?? this.#rgb;
	}
	set rgb(val) {
		this.setRgb(val);
	}

	constructor(hsv: HsvNormalised) {
		this.#h = hsv.h;
		this.#s = hsv.s;
		this.#v = hsv.v;
		this.#a = hsv.a;
	}

	static fromRgb(color: Rgb): Color | undefined {
		const normalise = normaliseRgb(color);
		if (normalise === undefined) return;
		const col = new Color(rgbToHsv(normalise));
		col.exactRgb = color;
		return col;
	}

	toRgbMaxOpacity(): Rgb {
		return rgbString(hsvToRgb({ h: this.h, s: this.s, v: this.v, a: 1 }));
	}
	setRgb(rgb: Rgb): boolean {
		const normalise = normaliseRgb(rgb);
		if (normalise === undefined) return false;
		const hsv = rgbToHsv(normalise);
		this.#h = hsv.h;
		this.#s = hsv.s;
		this.#v = hsv.v;
		this.#a = hsv.a;
		this.exactRgb = rgb;
		return true;
	}
	/** What will this color look like on top of the given background?
	 *  Only relevant if opacity exists on the element.
	 */
	rgbOnBackground(rgb: Rgb): Rgb {
		const normalisedFg = normaliseRgb(this.rgb);
		const normalisedBg = normaliseRgb(rgb);
		if (!normalisedFg || !normalisedBg) {
			return this.rgb;
		}

		return rgbString({
			r: lerp(normalisedBg.r, normalisedFg.r, normalisedFg.a * normalisedBg.a),
			g: lerp(normalisedBg.g, normalisedFg.g, normalisedFg.a * normalisedBg.a),
			b: lerp(normalisedBg.b, normalisedFg.b, normalisedFg.a * normalisedBg.a),
			a: (1 - normalisedFg.a) * (normalisedBg.a - 1) + 1
		});
	}
	/** Returns an RGB code of the current hue but with max saturation,
	 *  value, and alpha.
	 */
	pureHue(): Rgb {
		return rgbString(hsvToRgb({ h: this.h, s: 1, v: 1, a: 1 }));
	}
	/** Returns an RGB code of the current hue and value at max saturation
	 *  and alpha.
	 */
	maxSaturation(): Rgb {
		return rgbString(hsvToRgb({ h: this.h, s: 1, v: this.v, a: 1 }));
	}
	/** Returns an RGB code of the current hue and value at min saturation
	 *  and max alpha.
	 */
	minSaturation(): Rgb {
		return rgbString(hsvToRgb({ h: this.h, s: 0, v: this.v, a: 1 }));
	}
	/** Returns an RGB code of the current hue and saturation at max value
	 *  and alpha.
	 */
	maxBrightness(): Rgb {
		return rgbString(hsvToRgb({ h: this.h, s: this.s, v: 1, a: 1 }));
	}
	/** Describes the current hue (NOT COLOR) for accessibility. */
	hueName(): string {
		if (this.h < 15 / 360) return "red";
		if (this.h < 22 / 360) return "red-orange";
		if (this.h < 40 / 360) return "orange";
		if (this.h < 45 / 360) return "gold";
		if (this.h < 55 / 360) return "yellow";
		if (this.h < 70 / 360) return "yellow-green";
		if (this.h < 90 / 360) return "lime";
		if (this.h < 130 / 360) return "green";
		if (this.h < 155 / 360) return "spring green";
		if (this.h < 165 / 360) return "aqua green";
		if (this.h < 175 / 360) return "teal";
		if (this.h < 185 / 360) return "turquoise";
		if (this.h < 195 / 360) return "cyan";
		if (this.h < 205 / 360) return "sky blue";
		if (this.h < 220 / 360) return "blue";
		if (this.h < 235 / 360) return "dark blue";
		if (this.h < 250 / 360) return "indigo";
		if (this.h < 260 / 360) return "violet";
		if (this.h < 280 / 360) return "purple";
		if (this.h < 295 / 360) return "fuchsia";
		if (this.h < 320 / 360) return "magenta";
		if (this.h < 340 / 360) return "pink";
		if (this.h < 360 / 360) return "rose";
		return "unknown";
	}
}
