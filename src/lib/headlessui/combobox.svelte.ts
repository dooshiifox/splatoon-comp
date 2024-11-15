import { tick } from "svelte";
import {
	ariaBehavior,
	reflectAriaControls,
	reflectAriaExpanded,
	reflectAriaLabel,
	reflectAriaMultiselectable,
	reflectSelectedValueOnClose,
	setHasPopup,
	setRole,
	setTabIndex,
	setType
} from "./internal/aria.svelte";
import { applyBehaviors, onDestroy } from "./internal/behavior.svelte";
import {
	onClick,
	onClickOutside,
	onFocus,
	onInput,
	onKeydown,
	onPointerMoveChild
} from "./internal/events";
import { focusOnClose } from "./internal/focus.svelte";
import { keyBackspaceAllow, keyEnter, keyEscape, keyNavigation, keyTabAllow } from "./internal/key";
import { activate, getKey, isKeySelected, itemsEqual, unselectItem } from "./internal/list";
import type { Item, ItemKey } from "./internal/types";
import { noop, setUniqueNodeId } from "./internal/utils.svelte";
import { SvelteMap } from "svelte/reactivity";
import { unreachable } from "albtc";

export type ComboboxConfig<T extends Item> = {
	/** When the input closes, it automatically sets the input string to the
	 *  selected string. This returns the string to set the input to.
	 *  Return undefined to prevent this behavior.
	 *
	 *  Default behavior is to use the key of the item.
	 *
	 *  This only applies when there is a selected value and it is
	 *  not in multi-select mode.
	 */
	readonly getInputValue: (value: T) => string | undefined;
	filter: string;
	readonly label: string;
	expanded: boolean;
	selected: Array<T>;
	readonly multi: boolean;
	readonly onselect: (value: Array<T>) => void;
	readonly items: Array<{ value: T; disabled?: boolean; text?: string }>;
	/** When the filter changes, this determines how the active element reacts.
	 *
	 *  - 'item' means the same item will become active.
	 *  - 'index' means the same index will become active.
	 *  - 'first' means the first item will become active.
	 */
	readonly focusOnFilterChange: "item" | "index" | "first";
};

class Combobox<T extends Item> {
	private conf: ComboboxConfig<T>;

	controls = $state("");
	input = $state<HTMLElement | undefined>();
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

	get getInputValue() {
		return this.conf.getInputValue;
	}
	get filter() {
		return this.conf.filter;
	}
	set filter(val) {
		this.conf.filter = val;
	}
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

	constructor(init?: Partial<ComboboxConfig<T>>) {
		let filter = $state("");
		let expanded = $state(false);
		let selected = $state<Array<T>>([]);
		const conf: ComboboxConfig<T> = Object.defineProperties(
			{
				getInputValue(value) {
					return getKey(value).toString();
				},
				get filter() {
					return filter;
				},
				set filter(val) {
					filter = val;
				},
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
				items: [],
				focusOnFilterChange: "item"
			},
			Object.getOwnPropertyDescriptors(init)
		);

		this.conf = conf;
		$effect(() => {
			if (this.expanded && this.active === null) {
				this.active = this.nextActiveSelectable();
			} else if (!this.expanded && this.active !== null) {
				this.active = null;
			}
			if (this.expanded) {
				this.opened = true;
				this.focusInput();
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
		this.active = this.nextActiveSelectable();
	}
	close() {
		this.expanded = false;
		this.active = null;
	}
	toggle() {
		if (this.expanded) {
			this.close();
		} else {
			this.open();
		}
	}

	/** Resets the input and closes the modal. */
	reset() {
		this.filter = "";
		this.expanded = false;
	}

	/** Filters the list to items matching the input. */
	async filterList(filterString: string) {
		if (filterString === this.filter) return;

		// current active item
		const current = this.active === null ? this.selected[0] : this.items[this.active]?.value;

		this.filter = filterString;
		this.expanded = true;

		await tick();

		if (this.conf.focusOnFilterChange === "first") {
			this.active = this.firstActive();
		} else if (this.conf.focusOnFilterChange === "index") {
			let index = this.active ?? 0;
			while (index < this.items.length) {
				if (this.items[index].disabled !== true) {
					this.active = index;
					return;
				}
				index++;
			}
			// No item after this one can be made active, choose the last item.
			this.active = this.lastActive();
		} else if (this.conf.focusOnFilterChange === "item") {
			// always fallback to first unless there are no items matching
			// the filter in which case nothing can be active
			const selectedIndex = this.multi ? -1 : this.getItemIndex(this.selected[0]);
			const currentIndex = this.getItemIndex(current);

			let newActive: number | null = null;
			if (this.items.length > 0) {
				newActive = selectedIndex ?? currentIndex ?? 0;
			}

			if (this.active !== newActive) {
				this.active = newActive;
			}
		} else {
			unreachable(this.conf.focusOnFilterChange);
		}
	}

	/** Makes a specific item active by its index, and scrolls to it. */
	focus(newActive: number | null, expand = false) {
		if (this.active !== newActive) {
			this.expanded = this.expanded || expand;
			this.active = newActive;
			if (newActive === null) return;

			const newActiveItemKey = getKey(this.items[newActive].value);
			const element = this.getElementFromItem(newActiveItemKey);
			element?.scrollIntoView({ block: "nearest" });
		}
	}

	/** Sets the user's focus to the input box. */
	focusInput() {
		this.input?.focus();
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
		this.selected = newSelected;
		this.onselect(newSelected);
	}

	/** Unselects an item. */
	unselectItem(item: T) {
		this.selected = unselectItem(this.selected, item);
	}

	/** Unselect the last selected item when the backspace key is pressed
	 *  if multi-select is enabled and no input (filter).
	 */
	removeLastSelected() {
		if (!this.multi || this.filter !== "") {
			return;
		}

		const value = this.selected.pop();
		if (value === undefined) {
			return;
		}

		// Re-focus the unselected item in the dropdown
		void tick().then(() => {
			this.focus(this.getItemIndex(value) ?? null);
		});
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
		return getKey(active.value) === getKey(item);
	}
	/** Returns if the given item is disabled. */
	isDisabled(item: T | ItemKey<T>) {
		return this.getItem(item)?.disabled === true;
	}
}

/** A customisable listbox/dropdown with an input field to narrow down results,
 *  all with accessibility and keyboard features.
 *
 *  - [Documentation](https://captaincodeman.github.io/svelte-headlessui/combobox)
 *  - [Example](https://captaincodeman.github.io/svelte-headlessui/example/combobox)
 *
 *  This component also supports multi-select, which can be enabled by setting
 *  the `multi` property to `true`.
 *
 *  - [Multi-select documentation](https://captaincodeman.github.io/svelte-headlessui/combobox-multi)
 *  - [Multi-select example](https://captaincodeman.github.io/svelte-headlessui/example/combobox/multi)
 */
export function createCombobox<T extends Item>(init?: Partial<ComboboxConfig<T>>) {
	const prefix = "headlessui-combobox";

	const state = new Combobox(init);

	function input(node: HTMLElement) {
		setUniqueNodeId(node, prefix);
		state.input = node;

		const destroy = applyBehaviors(node, [
			setType("text"),
			setRole("combobox"),
			setTabIndex(0),
			reflectAriaLabel(state),
			reflectAriaExpanded(state),
			reflectAriaControls(state),
			reflectSelectedValueOnClose(state, (val) =>
				state.multi || val?.[0] === undefined ? undefined : state.getInputValue(val[0])
			),
			onKeydown(
				keyEnter(() => {
					// If theres only one item, set that to be active
					if (state.items.length === 1) {
						state.active = 0;
					}

					state.select();

					if (!state.multi) {
						state.toggle();
					}

					// Clear search input
					state.filter = "";
				}),
				keyEscape(() => state.close()),
				keyNavigation({
					first: () => state.focusFirst(),
					previous: () => state.focusPrevious(),
					next: () => state.focusNext(),
					last: () => state.focusLast()
				}),
				keyTabAllow(() => {
					state.select();
					state.close();
				}),
				keyBackspaceAllow(() => state.removeLastSelected())
			),
			onInput((text) => void state.filterList(text)),
			// NOTE: button might be a container of the input, or sibling of the input, depending on multi-select
			// onClick(() => {
			// 	if (!state.multi) {
			// 		state.toggle();
			// 	}
			// }),
			focusOnClose(state)
		]);

		return {
			destroy
		};
	}

	function button(node: HTMLElement) {
		setUniqueNodeId(node, prefix);
		state.button = node;

		const destroy = applyBehaviors(node, [
			setType("button"),
			setRole("button"),
			setHasPopup(),
			setTabIndex(-1),
			reflectAriaExpanded(state),
			reflectAriaControls(state),
			onClick(() => state.toggle()),
			onFocus(() => state.focusInput())
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
			setTabIndex(-1),
			onClickOutside(
				() => [state.input, state.button, node],
				() => state.close()
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

						// Clear search input
						state.filter = "";
					}
				)
			),
			onPointerMoveChild('[role="option"]', (n) => state.focusByNode(n)),
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

	return {
		/** A Svelte action to place on the combobox's input field. */
		input,
		/** A Svelte action to place on the combobox's toggle button to toggle
		 *  between open and closed without entering a value.
		 *  This button is typically found next to the input field with
		 *  a chevron icon.
		 */
		button,
		/** A Svelte action to place on a wrapper around the combobox's
		 *  list items in the dropdown. This is typically a `ul` element.
		 */
		list,
		/** A Svelte action to place on each list item of the
		 *  combobox's dropdown. Pass in the item's value and optionally
		 *  whether it is disabled.
		 */
		list_item,
		/** A Svelte action to place on each selected item to deselect it.
		 *  It must be passed the value of the item to deselect.
		 *  This is particularly useful in multi-select mode to deselect items
		 *  without needing to open the dropdown and click the item.
		 */
		deselect,
		/** Opens the dropdown. */
		open() {
			state.open();
		},
		/** Closes the dropdown. */
		close() {
			state.close();
		},
		/** Toggles whether the dropdown is open. Prefer `use:combobox.button`
		 *  over `<button onclick={combobox.toggle} />` as that has accessibility built-in.
		 */
		toggle() {
			state.toggle();
		},
		/** Resets the filter and closes the dropdown. Does not clear the
		 *  selected items.
		 */
		reset() {
			state.reset();
		},
		/** Returns if the item is currently selected. */
		isSelected(item: T | ItemKey<T>) {
			return state.isSelected(item);
		},
		/** Returns if the item is currently active. */
		isActive(item: T | ItemKey<T>) {
			return state.isActive(item);
		},
		/** Whether the dropdown is currently opened. */
		get expanded() {
			return state.expanded;
		},
		/** The currently-selected items. */
		get selected() {
			return state.selected;
		},
		/** The search input filter. */
		get filter() {
			return state.filter;
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
		/** Provides access to the internal `Combobox` class where the state lives.
		 *  This is useful for updating other state, for example `label` or `multi`.
		 */
		state
	};
}
