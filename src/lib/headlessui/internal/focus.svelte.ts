import { createWatchBehavior } from "./behavior.svelte";
import { Tab } from "./key";
import type { Behavior, Expandable } from "./types";

export function setFocus(node: HTMLElement, focus: boolean) {
	if (focus) {
		// may need to wait for svelte to update UI before we can set focus
		requestAnimationFrame(() => {
			node.focus({ preventScroll: true });
		});
	}
}

export function focusOnExpanded(store: Expandable): Behavior {
	return createWatchBehavior((node) => setFocus(node, store.expanded));
}

export function focusOnClose(store: Expandable): Behavior {
	return createWatchBehavior((node) =>
		setFocus(node, store.opened && !store.expanded)
	);
}

// Credit:
//  - https://stackoverflow.com/a/30753870
const focusableSelector = [
	"[contentEditable=true]",
	"[tabindex]",
	"a[href]",
	"area[href]",
	"button:not([disabled])",
	"iframe",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])"
];

function onKeyDown(event: KeyboardEvent) {
	if (event.key !== Tab) return;

	const container = event.currentTarget as HTMLElement;
	const element = event.target as HTMLElement;
	if (!container.contains(element)) return;

	const focusable = [
		...container.querySelectorAll(focusableSelector.join(","))
	];
	const first = focusable[0];
	const last = focusable[focusable.length - 1];

	// shift + tab on first element should wrap back to last
	if (element === first && event.shiftKey) {
		(last as HTMLElement).focus();
		event.preventDefault();
	}

	// plain tab on last element should wrap back to first
	if (element === last && !event.shiftKey) {
		(first as HTMLElement).focus();
		event.preventDefault();
	}
}

export function trapFocusOnOpen(store: Expandable): Behavior {
	return createWatchBehavior((node) => {
		if (store.expanded) {
			const focusable = node.querySelector(focusableSelector.join(","));
			if (focusable !== null) {
				requestAnimationFrame(() => (focusable as HTMLElement).focus());
			}

			node.addEventListener("keydown", onKeyDown);
		} else {
			node.removeEventListener("keydown", onKeyDown);
		}
	});
}
