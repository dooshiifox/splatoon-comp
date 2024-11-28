import { SvelteMap } from "svelte/reactivity";
import {
	ariaBehavior,
	reflectAriaControls,
	reflectAriaExpanded,
	reflectAriaLabel,
	reflectAriaMultiselectable,
	setHasPopup,
	setRole,
	setTabIndex,
	setType
} from "./internal/aria.svelte";
import { applyBehaviors, onDestroy } from "./internal/behavior.svelte";
import { onClick, onClickOutside, onKeydown, onPointerMoveChild } from "./internal/events";
import { focusOnClose, focusOnExpanded } from "./internal/focus.svelte";
import {
	keyCharacter,
	keyDown,
	keyEscape,
	keyNavigation,
	keySpaceOrEnter,
	keyTab,
	keyUp
} from "./internal/key";
import { activate, getKey, isKeySelected, itemsEqual, unselectItem } from "./internal/list";
import type { Item, ItemKey } from "./internal/types";
import { noop, setUniqueNodeId } from "./internal/utils.svelte";

export type ListboxConfig<T extends Item> = {
	readonly label: string;
	expanded: boolean;
	selected: Array<T>;
	readonly multi: boolean;
	readonly onselect: (value: Array<T>) => void;
	readonly items: Array<{ value: T; disabled?: boolean; text?: string }>;
};

class Listbox<T extends Item> {
	private conf: ListboxConfig<T>;

	controls = $state("");
	button = $state<HTMLElement | undefined>();
	opened = $state(false);

	private itemsToElements = $state<SvelteMap<ItemKey<T>, HTMLElement>>(new SvelteMap());
	assignElementToItem(item: T | ItemKey<T>, node: HTMLElement) {
		this.itemsToElements.set(getKey(item), node);
	}
	unassignElementFromItem(item: T | ItemKey<T>, node: HTMLElement) {
		// Make sure that its the same element first!
		if (this.itemsToElements.get(getKey(item)) === node) {
			this.itemsToElements.delete(getKey(item));
		}
	}
	getElementFromItem(item: T | ItemKey<T>): HTMLElement | undefined {
		return this.itemsToElements.get(getKey(item));
	}
	getItemIndexFromElement(node: HTMLElement) {
		const key = this.itemsToElements.entries().find(([, el]) => el.id === node.id)?.[0];
		if (key === undefined) return undefined;
		return this.getItemIndex(key);
	}
	active = $state<number | null>(null);

	get label() {
		return this.conf.label;
	}
	get expanded() {
		return this.conf.expanded;
	}
	set expanded(val) {
		this.conf.expanded = val;
	}
	get selected() {
		return this.conf.selected;
	}
	set selected(val) {
		this.conf.selected = val;
	}
	get multi() {
		return this.conf.multi;
	}
	get onselect() {
		return this.conf.onselect;
	}
	get items() {
		return this.conf.items;
	}

	constructor(init?: Partial<ListboxConfig<T>>) {
		let expanded = $state(false);
		let selected = $state<Array<T>>([]);
		const conf: ListboxConfig<T> = Object.defineProperties(
			{
				label: "",
				get expanded() {
					return expanded;
				},
				set expanded(val) {
					expanded = val;
				},
				get selected() {
					return selected;
				},
				set selected(val) {
					selected = val;
				},
				multi: false,
				onselect: noop,
				items: []
			},
			Object.getOwnPropertyDescriptors(init)
		);

		this.conf = conf;
		$effect(() => {
			if (this.expanded && this.active === null) {
				this.active = this.getItemIndex(this.selected[0]) ?? null;
			} else if (!this.expanded && this.active !== null) {
				this.active = null;
			}
			if (this.expanded) {
				this.opened = true;
			}
		});
	}

	getItem(item: T | ItemKey<T>) {
		return this.items.find((searchItem) => itemsEqual(item, searchItem.value));
	}
	getItemIndex(item: T | ItemKey<T>): number | undefined {
		const index = this.items.findIndex((searchItem) => itemsEqual(item, searchItem.value));
		if (index === -1) return undefined;
		return index;
	}

	nextActiveSelectable(): number | null {
		const firstSelected = this.selected[0];
		if (this.active === null && firstSelected !== undefined) {
			// handles selected items being removed from available list
			// (fallthrough to selecting first active item)
			const itemIndex = this.getItemIndex(firstSelected);
			if (itemIndex !== undefined && this.items[itemIndex].disabled !== true) {
				return itemIndex;
			}
		}

		return this.nextActive();
	}
	previousActiveSelectable(): number | null {
		const lastSelected = this.selected[this.selected.length - 1];
		if (this.active === null && lastSelected !== undefined) {
			// handles selected items being removed from available list
			// (fallthrough to selecting last active item)
			const itemIndex = this.getItemIndex(lastSelected);
			if (itemIndex !== undefined && this.items[itemIndex].disabled !== true) {
				return itemIndex;
			}
		}

		return this.previousActive();
	}

	/** Returns the first non-disabled item in the list. */
	firstActive(): number | null {
		const index = this.items.findIndex((item) => item.disabled !== true);
		if (index === -1) return null;
		return index;
	}
	/** Returns the last non-disabled item in the list. */
	lastActive(): number | null {
		const index = this.items.findLastIndex((item) => item.disabled !== true);
		if (index === -1) return null;
		return index;
	}

	/** Returns the index of the next non-disabled item in the list. */
	nextActive(): number | null {
		let index = this.active ?? -1;
		while (++index < this.items.length) {
			if (this.items[index].disabled !== true) {
				return index;
			}
		}

		// No next item. We were already on the last selectable item
		// or no items *can* be selected
		return this.active;
	}
	/** Returns the index of the previous non-disabled item in the list.
	 *
	 *  In the event there is no selected item, it finds from the end of the list.
	 *  Returns `null` if there are no non-disabled items.
	 */
	previousActive() {
		let index = this.active ?? this.items.length;
		while (--index > -1) {
			if (this.items[index].disabled !== true) {
				return index;
			}
		}

		// No previous item. We were already on the first selectable item.
		return this.active;
	}

	open() {
		this.expanded = true;
		this.active = this.getItemIndex(this.selected[0]) ?? null;
	}
	close() {
		this.expanded = false;
	}
	toggle() {
		if (this.expanded) {
			this.close();
		} else {
			this.open();
		}
	}

	/** Makes a specific item active by its index, and scrolls to it. */
	focus(newActive: number | null) {
		if (this.active !== newActive) {
			this.active = newActive;
			if (newActive === null) return;

			const newActiveItemKey = getKey(this.items[newActive].value);
			const element = this.getElementFromItem(newActiveItemKey);
			element?.scrollIntoView({ block: "nearest" });
		}
	}

	/** Focuses the first active element in the list. */
	focusFirst() {
		this.focus(this.firstActive());
	}
	/** Focuses the last active element in the list. */
	focusLast() {
		this.focus(this.lastActive());
	}

	/** Focuses the previous active element in the list. */
	focusPrevious() {
		this.focus(this.previousActiveSelectable());
	}
	/** Focuses the next active element in the list. */
	focusNext() {
		this.focus(this.nextActiveSelectable());
	}

	/** Finds a list item from a query string and focuses it. */
	searchAndFocus(query: string, prefixOnly = false) {
		const searchable =
			this.active === null
				? this.items
				: this.items.slice(this.active + 1).concat(this.items.slice(0, this.active + 1));

		const re = new RegExp(`${prefixOnly ? "^" : ""}${query}`, "i");
		const found = searchable.findIndex((x) => {
			if (x.disabled === true) return false;

			const searchText = x.text ?? this.getElementFromItem(x.value)?.innerText;
			if (searchText === undefined) return false;
			return searchText.match(re) !== null;
		});

		if (found !== -1) {
			const index = (found + (this.active ?? -1) + 1) % this.items.length;
			this.focus(index);
		}
	}

	/** Finds a list item by its node and focuses it. */
	focusByNode(node: HTMLElement | null) {
		if (node === null) {
			this.focus(null);
			return;
		}

		const index = this.getItemIndexFromElement(node);
		if (index === undefined || this.items[index].disabled === true) {
			this.focus(null);
			return;
		}
		this.focus(index);
	}

	private selectActive() {
		if (this.active === null || this.items[this.active]?.disabled === true) {
			return this.selected;
		}

		// set selected item, if in multi-select mode toggle selection
		const value = this.getActiveItem();

		if (this.multi) {
			if (value === undefined) return this.selected;

			const index = this.selected.findIndex((sel) => itemsEqual(sel, value.value));
			if (index === -1) {
				return [...this.selected, value.value];
			}
			return this.selected.toSpliced(index, 1);
		}

		if (value === undefined) return [];
		return [value.value];
	}

	/** Sets a new `selected` array.
	 *
	 *  - In multi mode, it toggles the current active value in the array.
	 *  - Else, it sets the array to the active value.
	 */
	select() {
		const newSelected = this.selectActive();
		if (newSelected.every((v, i) => getKey(v) === getKey(this.selected[i]))) return;
		this.selected = newSelected;
		this.onselect(newSelected);
	}

	/** Unselects an item. */
	unselectItem(item: T) {
		this.selected = unselectItem(this.selected, item);
	}
	/** Unselects all items. */
	unselectAll() {
		this.selected = [];
	}

	/** Returns if the item is currently selected. */
	isSelected(item: T | ItemKey<T>) {
		return isKeySelected(this.selected, getKey(item));
	}
	/** Returns the active item. */
	getActiveItem() {
		if (
			this.active === null ||
			this.active < 0 ||
			this.active >= this.items.length ||
			this.items.length === 0
		) {
			return undefined;
		}

		return this.items[this.active];
	}
	/** Returns if the item is currently active. */
	isActive(item: T | ItemKey<T>) {
		const active = this.getActiveItem();
		if (active === undefined) return false;
		return itemsEqual(active.value, item);
	}
	/** Returns if the given item is disabled. */
	isDisabled(item: T | ItemKey<T>) {
		return this.getItem(item)?.disabled === true;
	}
}

/** A customisable dropdown complete with accessibility and keyboard features.
 *
 *  - [Documentation](https://captaincodeman.github.io/svelte-headlessui/listbox)
 *  - [Example](https://captaincodeman.github.io/svelte-headlessui/example/listbox)
 *
 *  This component also supports multi-select, which can be enabled by setting
 *  the `multi` property to `true`.
 *
 *  - [Multi-select documentation](https://captaincodeman.github.io/svelte-headlessui/listbox-multi)
 *  - [Multi-select example](https://captaincodeman.github.io/svelte-headlessui/example/listbox/multi)
 */
export function createListbox<T extends Item>(init?: Partial<ListboxConfig<T>>) {
	const prefix = "headlessui-listbox";

	const state = new Listbox(init);

	function button(node: HTMLElement) {
		setUniqueNodeId(node, prefix);
		state.button = node;

		const destroy = applyBehaviors(node, [
			setType("button"),
			setRole("button"),
			setHasPopup(),
			setTabIndex(0),
			reflectAriaLabel(state),
			reflectAriaExpanded(state),
			reflectAriaControls(state),
			onClick(() => state.toggle()),
			onKeydown(
				keySpaceOrEnter(() => state.toggle()),
				keyUp(() => state.toggle()),
				keyDown(() => state.toggle())
			),
			focusOnClose(state)
		]);

		return {
			destroy
		};
	}

	function list(node: HTMLElement) {
		setUniqueNodeId(node, prefix);
		state.controls = node.id;

		const destroy = applyBehaviors(node, [
			setRole("listbox"),
			setTabIndex(0),
			onClickOutside(
				() => [state.button, node],
				() => {
					state.close();
				}
			),
			onClick(
				activate(
					'[role="option"]',
					(n) => state.focusByNode(n),
					() => {
						state.select();

						if (!state.multi) {
							state.close();
						}
					}
				)
			),
			onPointerMoveChild('[role="option"]', (n) => state.focusByNode(n)),
			onKeydown(
				keySpaceOrEnter(() => {
					state.select();

					// Allow clicking as many as you want without it closing
					// in multi-select mode.
					if (!state.multi) {
						state.close();
					}
				}),
				keyEscape(() => state.close()),
				keyNavigation({
					first: () => state.focusFirst(),
					previous: () => state.focusPrevious(),
					next: () => state.focusNext(),
					last: () => state.focusLast(),
					orientation: "vertical"
				}),
				keyTab(noop),
				keyCharacter((char) => state.searchAndFocus(char, true))
			),
			focusOnExpanded(state),
			ariaBehavior("aria-activedescendant", () => {
				const active = state.getActiveItem();
				if (active === undefined) return "";
				const element = state.getElementFromItem(active.value);
				return element?.id ?? "";
			}),
			reflectAriaMultiselectable(state)
		]);

		return {
			destroy
		};
	}

	// TODO: allow "any" type of value, as long as a text extractor is supplied (default function is treat as a string)
	// NOTE: text value is required for searchability
	function list_item(node: HTMLElement, initialValue: T | ItemKey<T>) {
		setUniqueNodeId(node, prefix);

		let value = $state(initialValue);
		state.assignElementToItem(value, node);

		const destroy = applyBehaviors(node, [
			setTabIndex(-1),
			setRole("option"),
			ariaBehavior("aria-disabled", () => state.isDisabled(value)),
			ariaBehavior("aria-selected", () => state.isSelected(value)),
			onDestroy(() => {
				state.unassignElementFromItem(value, node);
			})
		]);

		return {
			update(updatedValue: T | ItemKey<T>) {
				if (getKey(updatedValue) === getKey(value)) return;
				state.unassignElementFromItem(value, node);
				value = updatedValue;
				state.assignElementToItem(updatedValue, node);
			},
			destroy
		};
	}

	function deselect(node: HTMLElement, value: T) {
		const destroy = applyBehaviors(node, [
			onClick((e) => {
				state.unselectItem(value);
				e.stopImmediatePropagation();
			})
		]);

		return {
			destroy
		};
	}

	function deselectAll(node: HTMLElement) {
		const destroy = applyBehaviors(node, [
			onClick((e) => {
				state.unselectAll();
				e.stopImmediatePropagation();
			})
		]);

		return {
			destroy
		};
	}

	return {
		/** A Svelte action to place on the listbox's main button to
		 *  toggle between open and closed.
		 *  This button is typically the currently-selected value with a
		 *  chevron icon on the side.
		 */
		button,
		/** A Svelte action to place on a wrapper around the listbox's
		 *  list items in the dropdown. This is typically a `ul` element.
		 */
		list,
		/** A Svelte action to place on each list item of the listbox's dropdown.
		 *  Pass in the item's value and optionally whether it is disabled.
		 */
		list_item,
		/** A Svelte action to place on each selected item to deselect it.
		 *  It must be passed the value of the item to deselect.
		 *  This is particularly useful in multi-select mode to deselect items
		 *  without needing to open the dropdown and click the item.
		 */
		deselect,
		/** A Svelte action to deselect all items. */
		deselectAll,
		/** Opens the dropdown. */
		open(this: void) {
			state.open();
		},
		/** Closes the dropdown. */
		close(this: void) {
			state.close();
		},
		/** Toggles whether the dropdown is open. Prefer `use:listbox.button`
		 *  over `<button onclick={listbox.toggle} />` as that has accessibility built-in.
		 */
		toggle(this: void) {
			state.toggle();
		},
		/** Returns if the item is currently selected. */
		isSelected(selectItem: T | ItemKey<T>) {
			return state.isSelected(selectItem);
		},
		/** Returns if the item is currently active. */
		isActive(activeItem: T | ItemKey<T>) {
			return state.isActive(activeItem);
		},
		/** Whether the dropdown is currently opened. */
		get expanded() {
			return state.expanded;
		},
		/** The currently-selected items. */
		get selected() {
			return state.selected;
		},
		/** The current active item.
		 *
		 *  This is *not* the selected item. This is the hovered item or
		 *  keyboard-navigated item. `undefined` if no item is currently selected.
		 */
		get active() {
			return state.getActiveItem();
		},
		get items() {
			return state.items;
		},
		/** Provides access to the internal `Listbox` class where the state lives.
		 *  This is useful for updating other state, for example `label` or `multi`.
		 */
		state
	};
}
