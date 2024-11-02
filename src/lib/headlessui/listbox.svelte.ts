import {
	reflectAriaActivedescendent,
	reflectAriaControls,
	reflectAriaDisabled,
	reflectAriaExpanded,
	reflectAriaLabel,
	reflectAriaMultiselectable,
	reflectAriaSelected,
	setHasPopup,
	setRole,
	setTabIndex,
	setType
} from "./internal/aria.svelte";
import { applyBehaviors, onDestroy } from "./internal/behavior.svelte";
import {
	onClick,
	onClickOutside,
	onKeydown,
	onPointerMoveChild
} from "./internal/events";
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
import {
	activate,
	active,
	findItemIndex,
	firstActive,
	focusByNode,
	getItemValues,
	getKey,
	isKeyActive,
	isKeySelected,
	lastActive,
	nextActive,
	previousActive,
	raiseSelectOnChange,
	removeItem,
	searchAndFocus,
	selectActive
} from "./internal/list";
import type {
	Controllable,
	Expandable,
	Item,
	ItemKey,
	ItemOptions,
	Labelable,
	List,
	ListItem,
	Selectable
} from "./internal/types";
import {
	getActionOption,
	noop,
	setUniqueNodeId
} from "./internal/utils.svelte";

// TODO: add "value" selector, to pick text value off list item objects
export type ListboxConfig<T extends Item> = {
	button?: HTMLElement | undefined;
} & Labelable &
	Expandable &
	Controllable &
	List<T> &
	Selectable<T>;

class Listbox<T extends Item> implements ListboxConfig<T> {
	label = $state("");
	controls = $state("");
	button = $state<HTMLElement | undefined>();

	items = $state<Array<ListItem<T>>>([]);
	active = $state<number | null>(null);
	selected = $state<Array<T>>([]);
	multi = $state(false);
	onselect = $state<(value: Array<T>) => void>(noop);

	private _expanded = $state(false);
	private hasBeenOpened = $state(false);
	get expanded() {
		return this._expanded;
	}
	set expanded(val) {
		this._expanded = val;
		this.hasBeenOpened = this.hasBeenOpened || val;
	}

	get opened() {
		return this.hasBeenOpened;
	}

	constructor(init?: Partial<ListboxConfig<T>>) {
		this.reinit(init);
	}

	reinit(init?: Partial<ListboxConfig<T>>) {
		this.label = init?.label ?? this.label;
		this.controls = init?.controls ?? this.controls;
		this.button = init?.button ?? this.button;
		this._expanded = init?.expanded ?? this.expanded;
		this.hasBeenOpened = init?.opened ?? this.hasBeenOpened;
		this.items = init?.items ?? this.items;
		this.active = init?.active ?? this.active;
		this.selected = init?.selected ?? this.selected;
		this.multi = init?.multi ?? this.multi;
		this.onselect = init?.onselect ?? this.onselect;
	}

	open() {
		this.expanded = true;
		this.active = findItemIndex(this.items, this.selected[0]) ?? null;
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

			const item = this.items[newActive];
			if (item !== undefined) {
				item.node.scrollIntoView({ block: "nearest" });
			}
		}
	}

	/** Focuses the first active element in the list. */
	focusFirst() {
		this.focus(firstActive(this.items));
	}
	/** Focuses the last active element in the list. */
	focusLast() {
		this.focus(lastActive(this));
	}

	/** Focuses the previous active element in the list. */
	focusPrevious() {
		this.focus(previousActive(this));
	}
	/** Focuses the next active element in the list. */
	focusNext() {
		this.focus(nextActive(this));
	}

	/** Finds a list item from a query string and focuses it. */
	searchAndFocus(query: string, prefixOnly = false) {
		searchAndFocus(this, (index) => this.focus(index), query, prefixOnly);
	}

	/** Finds a list item by its node and focuses it. */
	focusByNode(node: HTMLElement | null) {
		focusByNode(this, (index) => this.focus(index), node);
	}

	/** Removes a list item from the list. */
	remove(node: HTMLElement) {
		this.items = removeItem(this.items, node);
	}

	/** Sets a new `selected` array.
	 *
	 *  - In multi mode, it toggles the current active value in the array.
	 *  - Else, it sets the array to the active value.
	 */
	select() {
		this.selected = selectActive(this);
	}

	/** Unselects an item. */
	unselectItem(item: T) {
		this.selected = this.selected.filter((selected) => selected !== item);
	}
	/** Unselects all items. */
	unselectAll() {
		this.selected = [];
	}

	/** Returns if the item is currently selected. */
	isSelected(item: T) {
		return isKeySelected(this.selected, getKey(item));
	}
	/** Returns if the item is currently selected by the item's key. */
	isKeySelected(key: ItemKey<T>) {
		return isKeySelected(this.selected, key);
	}
	/** Returns if the item is currently active. */
	isActive(item: T) {
		return isKeyActive(this, getKey(item));
	}
	/** Returns if the item is currently active by the item's key. */
	isKeyActive(key: ItemKey<T>) {
		return isKeyActive(this, key);
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
export function createListbox<T extends Item>(
	init?: Partial<ListboxConfig<T>>
) {
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
			focusOnClose(state),
			raiseSelectOnChange(state)
		]);

		return {
			destroy
		};
	}

	function items(node: HTMLElement) {
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
					last: () => state.focusLast()
				}),
				keyTab(noop),
				keyCharacter((char) => state.searchAndFocus(char, true))
			),
			focusOnExpanded(state),
			reflectAriaActivedescendent(state),
			reflectAriaMultiselectable(state)
		]);

		return {
			destroy
		};
	}

	// TODO: allow "any" type of value, as long as a text extractor is supplied (default function is treat as a string)
	// NOTE: text value is required for searchability
	function item(node: HTMLElement, options: ItemOptions<T>) {
		setUniqueNodeId(node, prefix);

		const optionValue = getActionOption(() => options.value);
		const optionDisabled = getActionOption(() => options.disabled);
		const optionText = getActionOption(() => options.text);

		const itemState = getItemValues<T>(node, {
			get value() {
				return optionValue.value;
			},
			get disabled() {
				return optionDisabled.value;
			},
			get text() {
				return optionText.value;
			}
		});

		state.items.push(itemState);

		const destroy = applyBehaviors(node, [
			setTabIndex(-1),
			setRole("option"),
			reflectAriaDisabled(state),
			reflectAriaSelected(state, itemState),
			onDestroy((n) => {
				state.remove(n);
				optionValue.destroy();
				optionDisabled.destroy();
				optionText.destroy();
			})
		]);

		return {
			update(opts: ItemOptions<T>) {
				optionValue.update(() => opts.value);
				optionDisabled.update(() => opts.disabled);
				optionText.update(() => opts.text);
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
		items,
		/** A Svelte action to place on each list item of the listbox's dropdown.
		 *  Pass in the item's value and optionally whether it is disabled.
		 */
		item,
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
		isSelected(selectItem: T) {
			return state.isSelected(selectItem);
		},
		/** Returns if the item is currently selected by the item's key. */
		isKeySelected(key: ItemKey<T>) {
			return state.isKeySelected(key);
		},
		/** Returns if the item is currently active. */
		isActive(activeItem: T) {
			return state.isActive(activeItem);
		},
		/** Returns if the item is currently active by the item's key. */
		isKeyActive(key: ItemKey<T>) {
			return state.isKeyActive(key);
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
			return active(state);
		},
		/** Provides access to the internal `Listbox` class where the state lives.
		 *  This is useful for updating other state, for example `label` or `multi`.
		 */
		state
	};
}
