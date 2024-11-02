import {
	ariaBehavior,
	reflectAriaMultiselectable,
	setRole,
	setTabIndex
} from "./internal/aria.svelte";
import { applyBehaviors, onDestroy } from "./internal/behavior.svelte";
import { onClick, onKeydown, onPointerMoveChild } from "./internal/events";
import { keyEnter, keyNavigation } from "./internal/key";
import { activate } from "./internal/list";
import type { Item, ItemKey } from "./internal/types";
import { noop, setUniqueNodeId } from "./internal/utils.svelte";

type ItemInfo<T extends Item> = {
	index: number;
	node: HTMLElement;
	key: ItemKey<T>;
	item: T;
};

/** Create a list of selectable items. */
class Selectable<T extends Item> {
	get items() {
		return this.config.items;
	}
	get multi() {
		return this.config.multi;
	}

	/** The current active item.
	 *
	 *  Use `key` if the key still exists, or `index` otherwise.
	 *  Note that `index` is the index in `items` and not the index in `itemsWithNode`.
	 *  Never assume `index` to be accurate. It should be used as a last resort
	 *  if `key` does not exist in the list.
	 */
	active = $state<{ key: ItemKey<T>; index: number } | null>(null);

	/** All the HTML elements mapped to their key */
	itemsWithNode = $state<
		Array<{ readonly node: HTMLElement; readonly key: ItemKey<T> }>
	>([]);

	/** When holding shift and using arrow keys or mouse, this is the item
	 *  that is at the start or end of the selection.
	 */
	currentShiftAnchor = $state<ItemKey<T> | null>(null);
	selected = $state<Array<ItemKey<T>>>([]);

	constructor(
		public config: { readonly items: Array<T>; readonly multi: boolean }
	) {}

	/** Returns the uniquely-identifying key for a given item. */
	getKey(item: T | ItemKey<T>): ItemKey<T> {
		return typeof item === "object" ? (item.key as ItemKey<T>) : item;
	}
	/** Returns the index of `item` in `items`. */
	getIndex(item: T | ItemKey<T>): number | null {
		const key = this.getKey(item);
		const index = this.items.findIndex((x) => this.getKey(x) === key);
		return index === -1 ? null : index;
	}
	/** Find and returns an item from the `items` list. */
	getItem(item: T | ItemKey<T>): T | null {
		const key = this.getKey(item);
		return this.items.find((x) => this.getKey(x) === key) ?? null;
	}
	/** Finds and returns an item from the `itemsWithNode` list. */
	getItemByNode(item: T | ItemKey<T>): HTMLElement | null {
		const key = this.getKey(item);
		return this.itemsWithNode.find((x) => x.key === key)?.node ?? null;
	}

	/** Selects an item.
	 *  - In single-select mode, this replaces the current selection.
	 *  - In multi-select mode, this adds to the current selection.
	 */
	select(item: T | ItemKey<T>) {
		const key = this.getKey(item);
		if (this.isSelected(key)) {
			return;
		}

		if (this.selected.length === 0) {
			this.currentShiftAnchor = key;
		}

		if (this.multi) {
			this.selected.push(key);
		} else {
			this.selected = [key];
		}
	}

	/** Selects the current active item. */
	selectActive(replace: boolean = false) {
		if (this.active === null) return;

		if (replace) {
			this.replaceSelection(this.active.key);
		} else {
			this.select(this.active.key);
		}
	}

	/** Replaces the entire selection with just this item. */
	replaceSelection(item: T | ItemKey<T>) {
		const key = this.getKey(item);
		this.selected = [key];
		this.currentShiftAnchor = key;
	}

	/** Selects all nodes between the shift anchor and the given node.
	 *  If no shift anchor exists, simply selects the given node.
	 */
	selectBetween(node: HTMLElement) {
		const key = this.itemsWithNode.find((x) => x.node === node)?.key;
		// Node is not in the list
		if (key === undefined) return;

		const itemIndex = this.getIndex(key);
		// Key no longer exists (shouldnt happen but lets check anyways)
		if (itemIndex === null) return;

		// No shift anchor, just select the node
		if (this.currentShiftAnchor === null) {
			this.select(key);
			return;
		}

		// Select all nodes between the anchor and the node
		const anchorIndex = this.getIndex(this.currentShiftAnchor);
		if (anchorIndex === null) return;

		// Select all nodes between the anchor and the node
		const min = Math.min(anchorIndex, itemIndex);
		const max = Math.max(anchorIndex, itemIndex);

		// Only select items that have a corresponding node
		this.selected = this.items
			.slice(min, max + 1)
			.filter((x) => this.getItemByNode(x) !== null)
			.map((x) => this.getKey(x));
	}

	/** Deselects a given item. */
	deselect(item: T | ItemKey<T>) {
		const key = this.getKey(item);
		this.selected = this.selected.filter((x) => x !== key);
	}

	/** Delects all items. */
	deselectAll() {
		this.selected = [];
	}

	/** Returns whether the given item is selected. */
	isSelected(item: T | ItemKey<T>) {
		return this.selected.includes(this.getKey(item));
	}
	/** Returns whether the given item is active. */
	isActive(item: T | ItemKey<T>) {
		return this.active?.key === this.getKey(item);
	}

	get selectedItems(): Array<T> {
		return this.selected
			.map((key) => this.getItem(key))
			.filter((x): x is T => x !== null);
	}

	/** Gets the active item. */
	get activeItem(): T | null {
		if (this.active === null) return null;

		// dont assume index to be accurate!!
		return this.getItem(this.active.key);
	}

	/** Makes a specific item active by its property key, and scrolls to it. */
	focus(newActive: T | ItemKey<T> | null, scroll: boolean = true) {
		// Trying to remove focus from all items
		if (newActive === null) {
			// Nothing changed
			if (this.active === null) return;

			this.active = null;
			return;
		}

		// Check if already selected
		const key = this.getKey(newActive);

		// Check item exists
		const itemIndex = this.getIndex(key);
		if (itemIndex === null) {
			console.warn(
				"Tried to select item",
				key,
				"but it doesn't exist in the list."
			);
			return;
		}

		// Only update if it's different
		if (this.active?.key !== key || this.active?.index !== itemIndex) {
			this.active = { key, index: itemIndex };
		}

		// Get and focus node
		const itemNode = this.getItemByNode(key);
		if (itemNode !== null && scroll) {
			itemNode.scrollIntoView({ block: "nearest" });
		}
	}

	focusFromInfo(info: ItemInfo<T> | null) {
		// Trying to remove focus from all items
		if (info === null) {
			// Nothing changed
			if (this.active === null) return;

			this.active = null;
			return;
		}

		// Only update if it's different
		if (this.active?.key !== info.key || this.active?.index !== info.index) {
			this.active = {
				key: info.key,
				index: info.index
			};
		}

		info.node.scrollIntoView({ block: "nearest" });
	}

	/** Returns the data of the next element in `items` that has a correspoding
	 *  item in `itemsWithNode`
	 */
	firstActiveSelectable(startIndex: number): ItemInfo<T> | null {
		for (let index = startIndex; index < this.items.length; index++) {
			const item = this.items[index]!;
			const key = this.getKey(item);

			// Has a corresponding node
			const node = this.getItemByNode(key);
			if (node !== null) {
				return {
					index,
					node,
					key,
					item
				};
			}
		}

		return null;
	}

	/** Returns the data of the last element in `items` that has a correspoding
	 *  item in `itemsWithNode`. Optionally start searching from `startIndex`.
	 *  Note that the index goes backwards.
	 */
	lastActiveSelectable(startIndex: number): ItemInfo<T> | null {
		for (let index = startIndex; index >= 0; index--) {
			const item = this.items[index]!;
			const key = this.getKey(item);

			// Has a corresponding node
			const node = this.getItemByNode(key);
			if (node !== null) {
				return {
					index,
					node,
					key,
					item
				};
			}
		}

		return null;
	}

	/** Focuses the first active element in the list. */
	focusFirst() {
		this.focusFromInfo(this.firstActiveSelectable(0));
	}
	/** Focuses the last active element in the list. */
	focusLast() {
		this.focusFromInfo(this.lastActiveSelectable(this.items.length));
	}

	/** Focuses the previous active element in the list. */
	focusPrevious() {
		// Start from the current active item
		// If nothing active, start from the end
		const startFrom =
			this.active === null
				? this.items.length
				: this.getIndex(this.active.key) ?? this.active.index;

		// Find the previous active item.
		const previous = this.lastActiveSelectable(startFrom - 1);

		// If nothing found, we're already on the first selectable item.
		if (previous === null) return;

		this.focusFromInfo(previous);
	}
	/** Focuses the next active element in the list. */
	focusNext() {
		// Start from the current active item
		// If nothing active, start from the start
		const startFrom =
			this.active === null
				? 0
				: (this.getIndex(this.active.key) ?? this.active.index) + 1;

		// Find the next active item.
		const next = this.firstActiveSelectable(startFrom);

		// If nothing found, we're already on the last selectable item.
		if (next === null) return;

		this.focusFromInfo(next);
	}

	/** Finds a list item by its node and focuses it. */
	focusByNode(node: HTMLElement | null, scroll: boolean = true) {
		if (node === null) {
			this.focus(null);
			return;
		}

		const item = this.itemsWithNode.find((x) => x.node === node);
		this.focus(item?.key ?? null, scroll);
	}
}

export function createSelectable<T extends Item>(init: {
	readonly items: Array<T>;
	readonly multi: boolean;
}) {
	const prefix = "headlessui-selectable";

	const state = new Selectable(init);

	function items(node: HTMLElement) {
		setUniqueNodeId(node, prefix);

		const destroy = applyBehaviors(node, [
			setRole("list"),
			setTabIndex(-1),
			// onClickOutside(() => [node], () => state.close()),
			onClick(
				activate(
					'[role="option"]',
					(n, event) => {
						state.focusByNode(n);

						if (n === null) return;

						if (event.shiftKey) {
							state.selectBetween(n);
							// disjointed selection makes things complex
							// } else if (event.ctrlKey) {
							// 	state.selectActive();
						} else {
							state.selectActive(true);
						}
					},
					noop
				)
			),
			onKeydown(
				keyEnter(() => state.selectActive()),
				keyNavigation({
					first: () => state.focusFirst(),
					previous: () => state.focusPrevious(),
					next: () => state.focusNext(),
					last: () => state.focusLast()
				})
			),
			onPointerMoveChild('[role="option"]', (n) => state.focusByNode(n, false)),
			ariaBehavior("aria-activedescendant", () => {
				const active = state.activeItem;
				if (active === null) return "";

				const activeNode = state.getItemByNode(active);
				return activeNode?.id ?? "";
			}),
			reflectAriaMultiselectable(state.config)
		]);

		return {
			destroy
		};
	}

	function item(node: HTMLElement, key: ItemKey<T>) {
		setUniqueNodeId(node, prefix);

		let keyState = $state(key);
		state.itemsWithNode.push({
			get key() {
				return keyState;
			},
			node
		});

		const destroy = applyBehaviors(node, [
			setTabIndex(-1),
			setRole("option"),
			ariaBehavior("aria-selected", () => state.isSelected(keyState)),
			onDestroy((n) => {
				state.itemsWithNode = state.itemsWithNode.filter((x) => x.node !== n);
			})
		]);

		return {
			update(newKey: ItemKey<T>) {
				keyState = newKey;
			},
			destroy
		};
	}

	return {
		/** A Svelte action to place on a wrapper around the selectable list's
		 *  list items. This is typically a `ul` element.
		 */
		items,
		/** A Svelte action to place on each list item of the
		 *  selectable list.
		 */
		item,
		/** Returns if the item is currently selected. */
		isSelected(item: T | ItemKey<T>) {
			return state.isSelected(item);
		},
		/** Whether the next node is selected. */
		isNextNodeSelected(item: T | ItemKey<T>) {
			const index = state.getIndex(state.getKey(item));
			if (index === null) return false;

			const next = state.firstActiveSelectable(index + 1);
			if (next === null) return false;

			return state.isSelected(next.key);
		},
		/** Whether the previous node is selected. */
		isPreviousNodeSelected(item: T | ItemKey<T>) {
			const index = state.getIndex(state.getKey(item));
			if (index === null) return false;

			const prev = state.lastActiveSelectable(index - 1);
			if (prev === null) return false;

			return state.isSelected(prev.key);
		},
		/** Returns if the item is currently active. */
		isActive(item: T | ItemKey<T>) {
			return state.isActive(item);
		},
		/** The currently-selected items. */
		get selected() {
			return state.selectedItems;
		},
		/** The current active item.
		 *
		 *  This is *not* the selected item. This is the hovered item or
		 *  keyboard-navigated item. `undefined` if no item is currently selected.
		 */
		get active() {
			return state.activeItem;
		},
		/** Provides access to the internal `Selectable` class where the state lives.
		 *  This is useful for updating other state.
		 */
		state
	};
}
