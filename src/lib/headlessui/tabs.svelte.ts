import { SvelteMap } from "svelte/reactivity";
import {
	ariaBehavior,
	reflectAriaLabel,
	reflectAriaOrientation,
	setRole,
	setTabIndex,
	setType
} from "./internal/aria.svelte";
import { applyBehaviors, createWatchBehavior, onDestroy } from "./internal/behavior.svelte";
import { onClick, onKeydown } from "./internal/events";
import { setFocus } from "./internal/focus.svelte";
import { keyNavigation, keySpaceOrEnter } from "./internal/key";
import { activate, getKey, itemsEqual } from "./internal/list";
import type { Item, ItemKey, Orientation } from "./internal/types";
import { noop, setUniqueNodeId } from "./internal/utils.svelte";

export type TabsConfig<T extends Item> = {
	readonly label: string;
	selected: T | undefined;
	readonly onselect: (value: T | undefined) => void;
	readonly items: Array<{ value: T; disabled?: boolean }>;
	readonly orientation: Orientation;
};

class Tabs<T extends Item> {
	private conf: TabsConfig<T>;

	private itemsToElements = $state<
		SvelteMap<ItemKey<T>, { tab: HTMLElement | undefined; panel: HTMLElement | undefined }>
	>(new SvelteMap());
	assignElementToItem(item: T | ItemKey<T>, type: "tab" | "panel", node: HTMLElement) {
		this.itemsToElements.set(getKey(item), { ...this.getElementsFromItem(item), [type]: node });
	}
	unassignElementFromItem(item: T | ItemKey<T>, type: "tab" | "panel", node: HTMLElement) {
		// Make sure that its the same element first!
		if (this.getElementsFromItem(item)[type] === node) {
			const el = { ...this.getElementsFromItem(item), [type]: undefined };
			if (el.panel === undefined && el.tab === undefined) {
				this.itemsToElements.delete(getKey(item));
			} else {
				this.itemsToElements.set(getKey(item), el);
			}
		}
	}
	getElementsFromItem(item: T | ItemKey<T>): {
		tab: HTMLElement | undefined;
		panel: HTMLElement | undefined;
	} {
		return (
			this.itemsToElements.get(getKey(item)) ?? {
				tab: undefined,
				panel: undefined
			}
		);
	}
	getItemKeyFromElement(node: HTMLElement) {
		return this.itemsToElements
			.entries()
			.find(([, el]) => el.tab?.id === node.id || el.panel?.id === node.id)?.[0];
	}
	getItemIndexFromElement(node: HTMLElement) {
		const key = this.getItemKeyFromElement(node);
		if (key === undefined) return undefined;
		return this.getItemIndex(key);
	}
	active = $state<number | null>(null);

	get label() {
		return this.conf.label;
	}
	get selected() {
		return this.conf.selected;
	}
	set selected(val) {
		this.conf.selected = val;
	}
	get items() {
		return this.conf.items;
	}
	get onselect() {
		return this.conf.onselect;
	}
	get orientation() {
		return this.conf.orientation;
	}

	constructor(init?: Partial<TabsConfig<T>>) {
		let selected = $state<T | undefined>(init?.items?.[0]?.value);
		const conf: TabsConfig<T> = Object.defineProperties(
			{
				label: "",
				orientation: "horizontal",
				get selected() {
					return selected;
				},
				set selected(val) {
					selected = val;
				},
				onselect: noop,
				items: []
			},
			Object.getOwnPropertyDescriptors(init)
		);

		this.conf = conf;
		this.active = this.selected ? (this.getItemIndex(this.selected) ?? null) : null;
	}

	getItem(item: T | ItemKey<T>) {
		return this.items.find((searchItem) => itemsEqual(item, searchItem.value));
	}
	getItemIndex(item: T | ItemKey<T>): number | undefined {
		const index = this.items.findIndex((searchItem) => itemsEqual(item, searchItem.value));
		if (index === -1) return undefined;
		return index;
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

	focus(newActive: number | null) {
		if (this.active !== newActive) {
			this.active = newActive;
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

	/** Focuses the previous active element in the list. */
	focusPrevious() {
		this.focus(this.previousActive());
	}
	/** Focuses the next active element in the list. */
	focusNext() {
		this.focus(this.nextActive());
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

		// set selected item
		const value = this.getActiveItem();
		if (value === undefined) return this.selected;
		return value.value;
	}

	/** Sets a new `selected` array.
	 *
	 *  - In multi mode, it toggles the current active value in the array.
	 *  - Else, it sets the array to the active value.
	 */
	select() {
		const newSelected = this.selectActive();
		if (newSelected !== undefined) {
			this.selected = newSelected;
			this.onselect(newSelected);
		}
	}

	/** Returns if the item is currently selected. */
	isSelected(item: T | ItemKey<T>) {
		return this.selected !== undefined && itemsEqual(this.selected, item);
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

/** Easily create accessible, fully customizable tab interfaces,
 *  with robust focus management and keyboard navigation support.
 *
 *  - [Documentation](https://captaincodeman.github.io/svelte-headlessui/tabs)
 *  - [Example](https://captaincodeman.github.io/svelte-headlessui/example/tabs)
 */
export function createTabs<T extends Item>(init?: Partial<TabsConfig<T>>) {
	const prefixTabs = "headlessui-tabs";
	const prefixTab = "headlessui-tab";
	const prefixPanel = "headlessui-panel";

	const state = new Tabs(init);

	function list(node: HTMLElement) {
		setUniqueNodeId(node, prefixTabs);

		const destroy = applyBehaviors(node, [
			setRole("tablist"),
			reflectAriaLabel(state),
			reflectAriaOrientation(state),
			setTabIndex(-1),
			onClick(
				activate(
					'[role="tab"]',
					(n) => state.focusByNode(n),
					() => state.select()
				)
			),
			onKeydown(
				keySpaceOrEnter(() => state.select()),
				keyNavigation({
					first: () => state.focusFirst(),
					previous: () => state.focusPrevious(),
					next: () => state.focusNext(),
					last: () => state.focusLast(),
					get orientation() {
						return state.orientation;
					}
				})
			),
			ariaBehavior("aria-activedescendant", () => {
				const active = state.getActiveItem();
				if (active === undefined) return "";
				return state.getElementsFromItem(active.value)?.tab?.id ?? "";
			})
		]);

		return {
			destroy
		};
	}

	function tab(node: HTMLElement, initialValue: T | ItemKey<T>) {
		setUniqueNodeId(node, prefixTab);
		let value = $state(initialValue);
		state.assignElementToItem(value, "tab", node);

		const destroy = applyBehaviors(node, [
			setType("button"),
			setRole("tab"),
			ariaBehavior("aria-selected", () => state.isSelected(value)),
			ariaBehavior("tabindex", () => (state.isSelected(value) ? "0" : "-1")),
			ariaBehavior("aria-controls", () => state.getElementsFromItem(value).panel?.id),
			createWatchBehavior((node) => {
				if (state.isSelected(value)) setFocus(node, true);
			}),
			onDestroy(() => {
				state.unassignElementFromItem(value, "tab", node);
			})
		]);

		return {
			update(updatedValue: T | ItemKey<T>) {
				if (getKey(updatedValue) === getKey(value)) return;
				state.unassignElementFromItem(value, "tab", node);
				value = updatedValue;
				state.assignElementToItem(updatedValue, "tab", node);
			},
			destroy
		};
	}

	function panel(node: HTMLElement, initialValue: T | ItemKey<T>) {
		setUniqueNodeId(node, prefixPanel);
		let value = $state(initialValue);
		state.assignElementToItem(value, "panel", node);

		const destroy = applyBehaviors(node, [
			setTabIndex(0),
			setRole("tabpanel"),
			ariaBehavior("aria-labelledby", () => state.getElementsFromItem(value).tab?.id),
			onDestroy(() => {
				state.unassignElementFromItem(value, "tab", node);
			})
		]);

		return {
			update(updatedValue: T | ItemKey<T>) {
				if (getKey(updatedValue) === getKey(value)) return;
				state.unassignElementFromItem(value, "panel", node);
				value = updatedValue;
				state.assignElementToItem(updatedValue, "panel", node);
			},
			destroy
		};
	}

	return {
		/** A Svelte action to place on the list of tabs. */
		list,
		/** A Svelte action to place on an individual tab item. It automatically
		 *  handles the functionality so you don't need to place an `onclick`
		 *  event on the tab. Regardless, the clickable element should be a
		 *  `button` for accessibility.
		 */
		tab,
		/** A Svelte action to place on a tab's panel. */
		panel,
		/** Returns if the item is currently selected. */
		isSelected(item: T | ItemKey<T>) {
			return state.isSelected(item);
		},
		/** Returns if the item is currently active. */
		isActive(item: T | ItemKey<T>) {
			return state.isActive(item);
		},
		/** The currently-selected tab. */
		get selected() {
			return state.selected;
		},
		/** The current active tab.
		 *
		 *  This is *not* the selected tab. This is the hovered tab or
		 *  keyboard-navigated tab. `undefined` if no tab is currently selected.
		 */
		get active() {
			return state.getActiveItem();
		},
		get items() {
			return state.items;
		},
		/** Provides access to the internal `Tabs` class where the state lives.
		 *  This is useful for updating other state, for example `label`.
		 */
		state
	};
}
