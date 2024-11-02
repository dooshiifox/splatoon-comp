import {
	ariaBehavior,
	reflectAriaActivedescendent,
	reflectAriaLabel,
	reflectAriaOrientation,
	reflectAriaSelected,
	setRole,
	setTabIndex,
	setType
} from "./internal/aria.svelte";
import {
	applyBehaviors,
	createWatchBehavior,
	onDestroy
} from "./internal/behavior.svelte";
import { onClick, onKeydown } from "./internal/events";
import { setFocus } from "./internal/focus.svelte";
import { keyNavigation, keySpaceOrEnter } from "./internal/key";
import {
	activate,
	active,
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
	selectActive
} from "./internal/list";
import type {
	Behavior,
	Item,
	ItemKey,
	ItemOptions,
	Labelable,
	List,
	ListItem,
	Orientable,
	Orientation,
	Selectable
} from "./internal/types";
import {
	getActionOption,
	noop,
	setUniqueNodeId
} from "./internal/utils.svelte";

export type TabsConfig<T extends Item> = {
	tabs: Array<HTMLElement>;
	panels: Array<HTMLElement>;
	auto: boolean;
} & Labelable &
	List<T> &
	Selectable<T> &
	Orientable;

function reflectAriaTabControls<T extends Item>(store: Tabs<T>): Behavior {
	return ariaBehavior(
		"aria-controls",
		(node) => store.panels[store.tabs.findIndex((tab) => tab === node)]?.id
	);
}

function reflectAriaTabIndex<T extends Item>(
	store: Tabs<T>,
	itemState: ListItem<T>
): Behavior {
	return ariaBehavior("tabindex", () =>
		isKeySelected(store.selected, getKey(itemState.value)) ? "0" : "-1"
	);
}

function reflectAriaPanelLabelledBy<T extends Item>(store: Tabs<T>): Behavior {
	return ariaBehavior(
		"aria-labelledby",
		(node) => store.tabs[store.panels.findIndex((panel) => panel === node)]?.id
	);
}

function focusOnSelect<T extends Item>(
	store: Tabs<T>,
	itemState: ListItem<T>
): Behavior {
	return createWatchBehavior((node) => {
		if (isKeySelected(store.selected, getKey(itemState.value)))
			setFocus(node, true);
	});
}

class Tabs<T extends Item> implements TabsConfig<T> {
	tabs = $state<Array<HTMLElement>>([]);
	panels = $state<Array<HTMLElement>>([]);
	auto = $state(true);

	label = $state("");
	items = $state<Array<ListItem<T>>>([]);
	active = $state<number | null>(null);
	selected = $state<Array<T>>([]);
	get value(): T | undefined {
		return this.selected[0];
	}
	multi = false;
	onselect = $state<(value: Array<T>) => void>(noop);

	orientation = $state<Orientation>("vertical");

	constructor(init?: Partial<TabsConfig<T>>) {
		this.reinit(init);
	}

	reinit(init?: Partial<TabsConfig<T>>) {
		this.tabs = init?.tabs ?? this.tabs;
		this.panels = init?.panels ?? this.panels;
		this.auto = init?.auto ?? this.auto;

		this.label = init?.label ?? this.label;
		this.items = init?.items ?? this.items;
		this.active = init?.active ?? this.active;
		this.selected = init?.selected ?? this.selected;
		this.multi = init?.multi ?? this.multi;
		this.onselect = init?.onselect ?? this.onselect;

		this.orientation = init?.orientation ?? this.orientation;
	}

	focus(newActive: number | null) {
		if (this.active !== newActive) {
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
					orientation: state.orientation
				})
			),
			reflectAriaActivedescendent(state),
			createWatchBehavior(() => {
				if (!state.auto) return;

				const selectedIndex = state.items.findIndex(
					(item) => state.value === item.value
				);
				if (selectedIndex === -1 && state.active !== null) {
					state.select();
				} else if (state.active !== selectedIndex) {
					state.select();
				}
			}),
			raiseSelectOnChange(state)
		]);

		return {
			destroy
		};
	}

	function tab(node: HTMLElement, options: ItemOptions<T>) {
		setUniqueNodeId(node, prefixTab);
		state.tabs.push(node);

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

		if (state.value === itemState.value) {
			state.active = state.tabs.length - 1;
		}

		const destroy = applyBehaviors(node, [
			setType("button"),
			setRole("tab"),
			reflectAriaSelected(state, itemState),
			reflectAriaTabIndex(state, itemState),
			reflectAriaTabControls(state),
			focusOnSelect(state, itemState),
			onDestroy(() => {
				state.remove(node);
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

	function panel(node: HTMLElement) {
		setUniqueNodeId(node, prefixPanel);
		state.panels.push(node);

		const destroy = applyBehaviors(node, [
			setTabIndex(0),
			setRole("tabpanel"),
			reflectAriaPanelLabelledBy(state),
			// reflectAriaDisabled(store),
			onDestroy(() => state.remove(node))
			// set to be visible / hidden based on selected state?
		]);

		return {
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
		/** The current active tab.
		 *
		 *  This is *not* the selected item. This is the hovered item or
		 *  keyboard-navigated item. `undefined` if no item is currently selected.
		 */
		get active() {
			return active(state);
		},
		/** The currently-selected tab. `undefined` if no tab is selected. */
		get selected() {
			return state.value;
		},
		/** Provides access to the internal `Tabs` class where the state lives.
		 *  This is useful for updating other state, for example `label`.
		 */
		state
	};
}
