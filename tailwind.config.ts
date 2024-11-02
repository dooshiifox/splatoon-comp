import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

export default {
	content: ["./src/**/*.{html,js,svelte,ts,svx}"],

	theme: {
		extend: {
			fontFamily: {
				"splatoon-text": "SplatoonText",
				"splatoon-block": "SplatoonBlock"
			}
		}
	},

	plugins: [forms]
} satisfies Config;
