// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		// For the planner editor, allows the user to keep touch inputs
		// registered even after the touch input has been released.
		// For developing the zooming feature of it.
		lockTouch?: boolean;
	}
}

export {};
