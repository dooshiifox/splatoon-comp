import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

export default {
	content: ["./src/**/*.{html,js,svelte,ts,svx}"],

	theme: {
		extend: {
			fontFamily: {
				"splatoon-text": "SplatoonText",
				"splatoon-block": "SplatoonBlock"
			},
			scrollMargin: {
				sensical: "clamp(50px,calc(20vh - 100px),200px)"
			}
		}
	},

	plugins: [forms]
} satisfies Config;
