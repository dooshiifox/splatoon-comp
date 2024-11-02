import { tick } from "svelte";
import {
	reflectAriaActivedescendent,
	reflectAriaControls,
	reflectAriaDisabled,
	reflectAriaExpanded,
	reflectAriaLabel,
	reflectAriaMultiselectable,
	reflectAriaSelected,
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
import {
	keyBackspaceAllow,
	keyEnter,
	keyEscape,
	keyNavigation,
	keyTabAllow
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
	nextActiveSelectable,
	previousActiveSelectable,
	raiseSelectOnChange,
	removeItem,
	selectActive,
	unselectItem
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
export type ComboboxConfig<T extends Item> = {
	input?: HTMLElement | undefined;
	button?: HTMLElement | undefined;
	/** When the input closes, it automatically sets the input string to the
	 *  selected string. This returns the string to set the input to.
	 *  Return undefined to prevent this behavior.
	 *
	 *  Default behavior is to use the key of the item.
	 *
	 *  This only applies when there is a selected value and it is
	 *  not in multi-select mode.
	 */
	getInputValue: (value: T) => string | undefined;
	filter: string;
	/** Whether we have moved active or not (to reset when filtering) */
	// NOTE: As far as I can tell, this is not used anywhere?
	moved: boolean;
} & Labelable &
	Expandable &
	Controllable &
	List<T> &
	Selectable<T>;

class Combobox<T extends Item> implements ComboboxConfig<T> {
	label = $state("");
	controls = $state("");
	input = $state<HTMLElement | undefined>();
	button = $state<HTMLElement | undefined>();
	filter = $state<string>("");
	moved = $state<boolean>(false);

	items = $state<Array<ListItem<T>>>([]);
	active = $state<number | null>(null);
	selected = $state<Array<T>>([]);
	multi = $state(false);
	onselect = $state<(value: Array<T>) => void>(noop);

	getInputValue: ComboboxConfig<T>["getInputValue"] = $state((value: T) =>
		getKey(value).toString()
	);

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

	constructor(init?: Partial<ComboboxConfig<T>>) {
		this.reinit(init);
	}

	reinit(init?: Partial<ComboboxConfig<T>>) {
		this.label = init?.label ?? this.label;
		this.controls = init?.controls ?? this.controls;
		this.input = init?.input ?? this.input;
		this.button = init?.button ?? this.button;
		this.filter = init?.filter ?? this.filter;
		this.moved = init?.moved ?? this.moved;
		this._expanded = init?.expanded ?? this.expanded;
		this.hasBeenOpened = init?.opened ?? this.hasBeenOpened;
		this.items = init?.items ?? this.items;
		this.active = init?.active ?? this.active;
		this.selected = init?.selected ?? this.selected;
		this.multi = init?.multi ?? this.multi;
		this.onselect = init?.onselect ?? this.onselect;
		this.getInputValue = init?.getInputValue ?? this.getInputValue;
	}

	open() {
		this.expanded = true;
		this.active = nextActiveSelectable(this);
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
		// current active item
		const current =
			this.active === null ? this.selected[0] : this.items[this.active]?.value;

		this.filter = filterString;
		this.expanded = true;

		await tick();

		// if we moved try to keep current active, otherwise use selected,
		// always fallback to first unless there are no items matching
		// the filter in which case nothing can be active
		const selectedIndex = this.multi
			? -1
			: findItemIndex(this.items, this.selected[0]);
		const currentIndex = findItemIndex(this.items, current);

		let newActive: number | null = null;
		if (this.items.length > 0) {
			if (this.moved) {
				newActive = currentIndex ?? 0;
			} else {
				newActive = selectedIndex ?? currentIndex ?? 0;
			}
		}

		if (this.active !== newActive) {
			this.active = newActive;
		}
	}

	/** Makes a specific item active by its index, and scrolls to it. */
	focus(newActive: number | null, expand = false) {
		if (this.active !== newActive) {
			this.expanded = this.expanded || expand;
			this.active = newActive;
			if (newActive === null) return;

			const item = this.items[newActive];
			if (item !== undefined) {
				item.node.scrollIntoView({ block: "nearest" });
			}
		}
	}

	/** Sets the user's focus to the input box. */
	focusInput() {
		this.input?.focus();
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
		this.focus(previousActiveSelectable(this));
	}
	/** Focuses the next active element in the list. */
	focusNext() {
		this.focus(nextActiveSelectable(this));
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
			this.focus(findItemIndex(this.items, value) ?? null);
		});
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
export function createCombobox<T extends Item>(
	init?: Partial<ComboboxConfig<T>>
) {
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
				state.multi || val?.[0] === undefined
					? undefined
					: state.getInputValue(val[0])
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
			onClick(() => {
				if (!state.multi) {
					state.toggle();
				}
			}),
			focusOnClose(state),
			raiseSelectOnChange(state)
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

	function items(node: HTMLElement) {
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
		items,
		/** A Svelte action to place on each list item of the
		 *  combobox's dropdown. Pass in the item's value and optionally
		 *  whether it is disabled.
		 */
		item,
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
		isSelected(item: T) {
			return state.isSelected(item);
		},
		/** Returns if the item is currently selected by the item's key. */
		isKeySelected(key: ItemKey<T>) {
			return state.isKeySelected(key);
		},
		/** Returns if the item is currently active. */
		isActive(item: T) {
			return state.isActive(item);
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
			return active(state);
		},
		/** Provides access to the internal `Combobox` class where the state lives.
		 *  This is useful for updating other state, for example `label` or `multi`.
		 */
		state
	};
}
