import {
	reflectAriaActivedescendent,
	reflectAriaControls,
	reflectAriaDisabled,
	reflectAriaExpanded,
	reflectAriaLabel,
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
	onPointerMoveChild,
	onPointerOut
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
	firstActive,
	focusByNode,
	getItemValues,
	getKey,
	isKeyActive,
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
import { getActionOption, noop, setUniqueNodeId } from "./internal/utils.svelte";

// TODO: add "value" selector, to pick text value off list item objects
export type MenuConfig<T extends Item> = {
	button?: HTMLElement | undefined;
} & Labelable &
	Expandable &
	Controllable &
	List<T> &
	Selectable<T>;

class Menu<T extends Item> implements MenuConfig<T> {
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

	constructor(init?: Partial<MenuConfig<T>>) {
		this.reinit(init);
	}

	reinit(init?: Partial<MenuConfig<T>>) {
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

	/** Open the menu and focus an item. */
	focus(newActive: number | null, expand = false) {
		if (this.active !== newActive) {
			this.expanded = this.expanded || expand;
			this.active = newActive;
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
		this.onselect(this.selected);
	}

	/** Unfocus all items. */
	unfocus() {
		this.active = null;
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

/** Menus offer an easy way to build custom, accessible dropdown components
 *  with robust support for keyboard navigation.
 *
 *  - [Documentation](https://captaincodeman.github.io/svelte-headlessui/menu)
 *  - [Example](https://captaincodeman.github.io/svelte-headlessui/example/menu)
 */
export function createMenu<T extends Item>(init?: Partial<MenuConfig<T>>) {
	const prefix = "headlessui-menu";

	const state = new Menu(init);

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
				keyUp(() => state.focusLast()),
				keyDown(() => state.focusFirst())
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
			setRole("menu"),
			setTabIndex(0),
			onClickOutside(
				() => [state.button, node],
				() => state.close()
			),
			onClick(
				activate(
					'[role="menuitem"]',
					(n) => {
						state.focusByNode(n);
					},
					() => {
						state.select();
						state.close();
					}
				)
			),
			onPointerMoveChild('[role="menuitem"]', (n) => state.focusByNode(n)),
			onPointerOut(() => state.unfocus()),
			onKeydown(
				keySpaceOrEnter(() => {
					state.select();
					state.close();
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
			reflectAriaActivedescendent(state)
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
			setRole("menuitem"),
			reflectAriaDisabled(state),
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

	return {
		/** A Svelte action to place on the menu's toggle button to
		 *  toggle between open and closed.
		 */
		button,
		/** A Svelte action to place on a wrapper around the menu's
		 *  list items in the dropdown. This is typically a `ul` element.
		 */
		items,
		/** A Svelte action to place on each list item of the menu's dropdown.
		 *  Pass in the item's value and optionally whether it is disabled.
		 */
		item,
		/** Opens the dropdown. */
		open() {
			state.open();
		},
		/** Closes the dropdown. */
		close() {
			state.close();
		},
		/** Toggles whether the dropdown is open. Prefer `use:menu.button`
		 *  over `<button onclick={menu.toggle} />` as that has accessibility built-in.
		 */
		toggle() {
			state.toggle();
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
		/** The current active item.
		 *
		 *  This is the hovered item or keyboard-navigated item.
		 *  `undefined` if no item is currently selected.
		 */
		get active() {
			return active(state);
		},
		/** Provides access to the internal `Menu` class where the state lives.
		 *  This is useful for updating other state, for example `label`.
		 */
		state
	};
}
