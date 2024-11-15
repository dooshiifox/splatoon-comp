import { createWatchBehavior } from "./behavior.svelte";
import type {
	Behavior,
	Callable,
	Item,
	ItemKey,
	ItemOptions,
	List,
	ListItem,
	Selectable
} from "./types";

/** Returns the unique(?) key from an item. */
export function getKey<T extends Item>(item: T | ItemKey<T>): ItemKey<T> {
	return typeof item === "object" ? item.key : item;
}
/** Compares two list items to see if they are equal. */
export function itemsEqual<T extends Item>(a: T, b: T) {
	return getKey(a) === getKey(b);
}

/** Returns a new list with the given node removed. */
export function removeItem<T extends Item>(items: Array<ListItem<T>>, node: HTMLElement) {
	return items.filter((item) => item.id !== node.id);
}
/** Unselect an item by its value. */
export function unselectItem<T extends Item>(selected: Array<T>, key: T): Array<T> {
	return selected.filter((item) => !itemsEqual(item, key));
}

/** Returns the value of the current active item in the list. */
export function active<T extends Item>(state: List<T>) {
	if (
		state.active === null ||
		state.active < 0 ||
		state.active >= state.items.length ||
		state.items.length === 0
	) {
		return undefined;
	}

	return state.items[state.active]?.value;
}

/** Focuses an event target's child by query selector and calls a callback when
 *  an event is received.
 */
export function activate<T extends Event>(
	selector: string,
	focus: (node: HTMLElement | null, event: T) => void,
	action: Callable
) {
	return (event: T) => {
		const el = (event.target as Element).closest<HTMLElement>(selector);

		// Means clicking whitespace (e.g., between listbox li elements or
		// padding) won't call the callback (generally, closing it.)
		// Not compatible with headlessui pre-v1. See if this is a good idea to keep.
		if (el === null) return;

		focus(el, event);
		action();
	};
}

/** Calls the `onselect` method on a `Selectable` when the selected element
 *  changes.
 */
export function raiseSelectOnChange<T extends Item>(store: Selectable<T>): Behavior {
	return createWatchBehavior(() => {
		store.onselect(store.selected);
	});
}

/** Returns a new `selected` array.
 *
 *  - In `multi` mode, it toggles the current active value in the array.
 *  - Else, it sets the array to the active value.
 */
export function selectActive<T extends Item>(state: List<T> & Selectable<T>): Array<T> {
	if (state.active === null || state.items[state.active]?.disabled !== false) {
		return state.selected;
	}

	// set selected item, if in multi-select mode toggle selection
	const value = active(state);
	if (state.multi) {
		if (value === undefined) return state.selected;

		if (state.selected.includes(value)) {
			return state.selected.filter((alreadySelected) => !itemsEqual(alreadySelected, value));
		}
		return [...state.selected, value];
	}

	if (value === undefined) return [];
	return [value];
}

/** Returns information about an list item entry. */
export function getItemValues<T extends Item>(
	node: HTMLElement,
	options: ItemOptions<T>
): ListItem<T> {
	return {
		id: node.id,
		node,
		get text() {
			return options.text ?? node.textContent?.trim() ?? "";
		},
		get value() {
			return options.value;
		},
		get disabled() {
			return options.disabled ?? false;
		}
	};
}

/** Returns the index of the first non-disabled list item.
 *
 *  In the event there is no selectable item, it returns `null`.
 */
export function firstActive(items: List<Item>["items"]) {
	const index = items.findIndex((item) => !item.disabled);
	if (index === -1) return null;
	return index;
}

/** Returns the index of the last non-disabled list item.
 *
 *  In the event there is no selectable item, it returns `null`.
 */
export function lastActive<T extends Item>(state: List<T>) {
	const index = state.items.findLastIndex((item) => !item.disabled);
	if (index === -1) return null;
	return index;
}

/** Returns the index of the previous non-disabled list item.
 *
 *  In the event there is no selected item, it finds from the end of the list.
 *  Returns `null` if there are no non-disabled items.
 */
export function previousActive(state: List<Item>) {
	let index = state.active ?? state.items.length;
	while (--index > -1) {
		if (state.items[index]?.disabled === false) {
			return index;
		}
	}

	// No previous item. We were already on the first selectable item.
	return state.active;
}

/** Returns the index of the previous non-disabled list item.
 *
 *  In the event there is no selected item, it finds from the end of the list.
 *  Returns `null` if there are no non-disabled items.
 */
export function nextActive<T extends Item>(state: List<T>) {
	let index = state.active ?? -1;
	while (++index < state.items.length) {
		if (state.items[index]?.disabled === false) {
			return index;
		}
	}

	// No next item. We were already on the last selectable item.
	return state.active;
}

/** Make the last selected item the active item, or the last item if there
 *  are no selected items.
 */
export function previousActiveSelectable<T extends Item>(state: List<T> & Selectable<T>) {
	const lastSelected = state.selected[state.selected.length - 1];
	if (state.active === null && lastSelected !== undefined) {
		const index = state.items.findIndex((x) => itemsEqual(x.value, lastSelected));

		// handles selected items being removed from available list
		// (fallthrough to selecting last active item)
		if (index > -1) {
			return index;
		}
	}

	return previousActive(state);
}

/** Make the first selected item the active item, or the first item if there
 *  are no selected items.
 */
export function nextActiveSelectable<T extends Item>(state: List<T> & Selectable<T>) {
	const firstSelected = state.selected[0];
	if (state.active === null && firstSelected !== undefined) {
		const index = state.items.findIndex((x) => itemsEqual(x.value, firstSelected));

		// handles selected items being removed from available list
		// (fallthrough to selecting first active item
		if (index > -1) {
			return index;
		}
	}

	return nextActive(state);
}

/** Find and focus a list item by the item's node. */
export function focusByNode<T extends Item>(
	list: List<T>,
	focus: (active: number | null) => void,
	node: HTMLElement | null
) {
	if (node === null) {
		focus(null);
		return;
	}

	focus(list.items.findIndex((item) => item.id === node.id && !item.disabled) ?? null);
}

/** Select the first item in the list matching the query. */
export function searchAndFocus<T extends Item>(
	list: List<T>,
	focus: (active: number) => void,
	query: string,
	prefixOnly: boolean = false
) {
	const searchable =
		list.active === null
			? list.items
			: list.items.slice(list.active + 1).concat(list.items.slice(0, list.active + 1));

	const re = new RegExp(`${prefixOnly ? "^" : ""}${query}`, "i");
	const found = searchable.findIndex((x) => x.text.match(re) !== null && !x.disabled);

	if (found !== -1) {
		const index = (found + (list.active ?? -1) + 1) % list.items.length;
		focus(index);
	}
}

/** Finds an item's index by its value. */
export function findItemIndex<T extends Item>(
	items: Array<ListItem<T>>,
	value: T | undefined
): number | undefined {
	if (value === undefined) return undefined;
	const index = items.findIndex((item) => itemsEqual(item.value, value));
	return index === -1 ? undefined : index;
}

/** Returns if the item is currently selected, by the item's key. */
export function isKeySelected<T extends Item>(selected: Array<T>, key: ItemKey<T>): boolean {
	return selected.findIndex((i) => key === getKey(i)) !== -1;
}

/** Returns if the item is currently active, by the item's key. */
export function isKeyActive<T extends Item>(list: List<T>, key: ItemKey<T>): boolean {
	const currentActive = active(list);
	if (currentActive === undefined) return false;
	return getKey(currentActive) === key;
}
