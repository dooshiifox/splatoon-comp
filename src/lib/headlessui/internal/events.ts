import type { KeyHandler } from "./key";
import type { Behavior, Cleanup } from "./types";

/** Defines and waits for a specific event on a node.
 *  Returns a cleanup function.
 */
export function listener<K extends keyof HTMLElementEventMap>(
	node: HTMLElement,
	type: K,
	handler: (event: HTMLElementEventMap[K], node: HTMLElement) => void,
	options: boolean | AddEventListenerOptions = false
): Cleanup {
	const h = (e: HTMLElementEventMap[K]) => handler(e, node);
	node.addEventListener(type, h, options);
	return () => node.removeEventListener(type, h, options);
}
/** Creates a new `Behavior` that waits for an event to be emitted on the node
 *  and calls the handler.
 */
export function listenerBehavior<K extends keyof HTMLElementEventMap>(
	type: K,
	handler: (event: HTMLElementEventMap[K], node: HTMLElement) => void,
	options: boolean | AddEventListenerOptions = false
): Behavior {
	return (node) => listener(node, type, handler, options);
}

// TODO: ensure node is type HTMLInputElement when applied
/** Runs the handler whenever an input event is registered. */
export function onInput(fn: (value: string) => void): Behavior {
	return listenerBehavior("input", (event) => {
		const el = event.target as HTMLInputElement;
		fn(el.value);
	});
}

/** Runs the handlers whenever a key is pressed. */
export function onKeydown(...handlers: Array<KeyHandler>): Behavior {
	return listenerBehavior("keydown", (event) => handlers.forEach((handler) => handler(event)));
}

/** Runs the callback whenever an element is focused. */
export function onFocus(fn: (event: FocusEvent) => void): Behavior {
	return listenerBehavior("focus", fn);
}

/** Runs the callback whenever a click event is registered. */
export function onClick(fn: (event: MouseEvent) => void) {
	return listenerBehavior("click", fn);
}

export function onClickOutside(
	getContainers: () => Array<HTMLElement | undefined>,
	fn: (event: Event) => void
): Behavior {
	return () => {
		let initial: Node | null = null;

		function handler(event: Event) {
			// ignore space as click
			if ((event as PointerEvent).pointerType === "") return;

			// ignore non-primary clicks
			if (initial === null) return;

			// get container nodes that we care about being outside of
			const containers = getContainers().filter((node) => node) as Array<HTMLElement>;

			// bail if we're inside one of the containers (i.e. it's not a click outside)
			for (const node of containers) {
				if (node.contains(initial)) {
					return;
				}
			}

			fn(event);

			initial = null;
		}

		function setInitial(event: PointerEvent) {
			if (event.isPrimary) {
				initial = event.target as Node;
			}
		}

		const listeners = [
			listener(document.documentElement, "pointerdown", setInitial, true),
			listener(document.documentElement, "click", handler, true)
		];

		return () => listeners.forEach((unlisten) => unlisten());
	};
}

export function onPointerMove(fn: (node: HTMLElement) => void): Behavior {
	return listenerBehavior("pointermove", (_, node) => fn(node));
}

export function onPointerOut(fn: () => void): Behavior {
	return listenerBehavior("pointerout", fn);
}

export function onPointerMoveChild(
	selector: string,
	fn: (node: HTMLElement | null) => void
): Behavior {
	return listenerBehavior("pointermove", (event, node) => {
		if (event.target !== node) {
			const el = (event.target as Element).closest(selector);
			fn(el as HTMLElement);
		}
	});
}
