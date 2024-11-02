import type { Callable, Orientation } from "./types";
import { noop } from "./utils.svelte";

// Ref: https://www.w3.org/TR/uievents-key/#named-key-attribute-values
export const Space = " ";
export const Enter = "Enter";
export const Esc = "Esc";
export const Escape = "Escape";
export const Backspace = "Backspace";
export const Tab = "Tab";

export const ArrowLeft = "ArrowLeft";
export const ArrowUp = "ArrowUp";
export const ArrowRight = "ArrowRight";
export const ArrowDown = "ArrowDown";

export const Home = "Home";
export const End = "End";
export const Up = "Up";
export const Down = "Down";

export const PageUp = "PageUp";
export const PageDown = "PageDown";

export type KeyHandler = (event: KeyboardEvent) => void;

export function blockDefaultKeyAction(event: KeyboardEvent) {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
}

export const allowDefaultKeyAction = noop;

export function keyHandler(
	matches: Array<string>,
	action: KeyHandler = blockDefaultKeyAction
) {
	return (fn: Callable): KeyHandler => {
		return (event) => {
			if (matches.includes(event.key)) {
				fn();
				action(event);
			}
		};
	};
}

export const keySpaceOrEnter = keyHandler([Space, Enter]);
export const keySpace = keyHandler([Space]);
export const keyEnter = keyHandler([Enter]);
export const keyEscape = keyHandler([Escape]);
export const keyBackspace = keyHandler([Backspace]);
export const keyBackspaceAllow = keyHandler([Backspace], allowDefaultKeyAction);
export const keyTab = keyHandler([Tab]);
export const keyTabAllow = keyHandler([Tab], allowDefaultKeyAction);

export const keyLeft = keyHandler([ArrowLeft]);
export const keyRight = keyHandler([ArrowRight]);
export const keyUp = keyHandler([ArrowUp]);
export const keyDown = keyHandler([ArrowDown]);

export const keyHomePageUp = keyHandler([Home, PageUp]);
export const keyEndPageDn = keyHandler([End, PageDown]);

export function keyNavigation({
	first,
	previous,
	next,
	last,
	orientation = "vertical"
}: {
	first: Callable;
	previous: Callable;
	next: Callable;
	last: Callable;
	orientation?: Orientation;
}): KeyHandler {
	const handleFirst = keyHomePageUp(first);
	const handlePrevious =
		orientation === "vertical" ? keyUp(previous) : keyLeft(previous);
	const handleNext =
		orientation === "vertical" ? keyDown(next) : keyRight(next);
	const handleLast = keyEndPageDn(last);

	return (event) => {
		handleFirst(event);
		handlePrevious(event);
		handleNext(event);
		handleLast(event);
	};
}

// is single, printable character
export function isCharacter(value: string) {
	return /^\S$/.test(value);
}

export function keyCharacter(fn: (query: string) => void): KeyHandler {
	let timeout: number | undefined = undefined;
	let query = "";

	return (event) => {
		const { key } = event;
		if (isCharacter(key)) {
			if (timeout !== undefined) {
				clearTimeout(timeout);
			}

			query += key;
			fn(query);

			timeout = window.setTimeout(() => {
				timeout = 0;
				query = "";
			}, 350);
		}
	};
}
