import {
	reflectAriaControls,
	reflectAriaExpanded,
	reflectAriaLabel,
	setHasPopup,
	setRole,
	setTabIndex,
	setType
} from "./internal/aria.svelte";
import { applyBehaviors } from "./internal/behavior.svelte";
import { onClick, onClickOutside, onKeydown } from "./internal/events";
import { focusOnClose, focusOnExpanded } from "./internal/focus.svelte";
import { keyEscape, keySpaceOrEnter } from "./internal/key";
import type { Controllable, Expandable, Labelable } from "./internal/types";
import { setUniqueNodeId } from "./internal/utils.svelte";

export type PopoverConfig = {
	button?: HTMLElement | undefined;
	panel?: string;
} & Labelable &
	Expandable &
	Controllable;

class Popover implements PopoverConfig {
	label = $state("");
	controls = $state("");
	button = $state<HTMLElement>();
	panel = $state("");

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

	constructor(init?: Partial<PopoverConfig>) {
		this.reinit(init);
	}

	reinit(init?: Partial<PopoverConfig>) {
		this.label = init?.label ?? this.label;
		this.controls = init?.controls ?? this.controls;
		this.button = init?.button ?? this.button;
		this.panel = init?.panel ?? this.panel;
		this._expanded = init?.expanded ?? this.expanded;
		this.hasBeenOpened = init?.opened ?? this.hasBeenOpened;
	}

	open() {
		this.expanded = true;
	}
	close() {
		this.expanded = false;
	}
	toggle() {
		this.expanded = !this.expanded;
	}
}

/** Popovers are perfect for floating panels with arbitrary content like
 *  navigation menus, mobile menus and flyout menus.
 * 
 *  - [Documentation](https://captaincodeman.github.io/svelte-headlessui/popover)
 *  - [Example](https://captaincodeman.github.io/svelte-headlessui/example/popover)
 */
export function createPopover(init?: Partial<PopoverConfig>) {
	const prefix = "headlessui-popover";

	const state = new Popover(init);

	function button(node: HTMLElement) {
		setUniqueNodeId(node, prefix);
		state.button = node;

		const destroy = applyBehaviors(node, [
			setType("button"),
			setRole("button"),
			setHasPopup(),
			setTabIndex(0),
			reflectAriaExpanded(state),
			reflectAriaLabel(state),
			reflectAriaControls(state),
			onClick(() => state.toggle()),
			onKeydown(
				keyEscape(() => state.close()),
				keySpaceOrEnter(() => state.toggle())
			),
			focusOnClose(state)
		]);

		return {
			destroy
		};
	}

	function panel(node: HTMLElement) {
		setUniqueNodeId(node, prefix);
		state.panel = node.id;
		state.controls = node.id;

		const destroy = applyBehaviors(node, [
			setRole("menu"),
			onClickOutside(
				() => [state.button, node],
				() => state.close()
			),
			focusOnExpanded(state)
		]);

		return {
			destroy
		};
	}

	return {
		/** A Svelte action to place on the popover's toggle button to
		 *  toggle between open and closed.
		 */
		button,
		/** A Svelte action to place on the popover's content to
		 *  provide better accessibility.
		 */
		panel,
		/** Opens the popover. */
		open() {
			state.open();
		},
		/** Closes the popover. */
		close() {
			state.close();
		},
		/** Toggles whether the popover is open. Prefer `use:popover.button`
		 *  over `<button onclick={popover.toggle} />` as that has accessibility built-in.
		 */
		toggle() {
			state.toggle();
		},
		/** Whether the popover is currently opened. */
		get expanded() {
			return state.expanded;
		},
		/** Provides access to the internal `Popover` class where the state lives.
		 *  This is useful for updating other state, for example `label`.
		 */
		state
	};
}
