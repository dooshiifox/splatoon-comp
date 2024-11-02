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
import { onClick, onKeydown } from "./internal/events";
import { focusOnClose, focusOnExpanded } from "./internal/focus.svelte";
import { keyEscape, keySpaceOrEnter } from "./internal/key";
import type { Controllable, Expandable, Labelable } from "./internal/types";
import { setUniqueNodeId } from "./internal/utils.svelte";

export type DisclosureConfig = {
	/** The node ID of the button to open the disclosure. */
	button?: string;
	/** The node ID of the panel (i.e., the disclosure contents). */
	panel?: string;
} & Labelable &
	Expandable &
	Controllable;

class Disclosure implements DisclosureConfig {
	label = $state("");
	controls = $state("");
	button = $state("");
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

	constructor(init?: Partial<DisclosureConfig>) {
		this.reinit(init);
	}

	reinit(init?: Partial<DisclosureConfig>) {
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

/** A simple, accessible foundation for building custom UIs that
 *  show and hide content, like togglable accordion panels.
 * 
 *  - [Documentation](https://captaincodeman.github.io/svelte-headlessui/disclosure)
 *  - [Example](https://captaincodeman.github.io/svelte-headlessui/example/disclosure)
 */
export function createDisclosure(init?: Partial<DisclosureConfig>) {
	const prefix = "headlessui-disclosure";

	const state: Disclosure = new Disclosure(init);

	function button(node: HTMLElement) {
		setUniqueNodeId(node, prefix);
		state.button = node.id;

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
				keyEscape(close),
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

		const destroy = applyBehaviors(node, [focusOnExpanded(state)]);

		return {
			destroy
		};
	}

	return {
		/** A Svelte action to place on the disclosure's toggle button.
		 *  This is typically text with the name of the disclosure and a chevron
		 *  icon to indicate the open/closed state.
		 */
		button,
		/** A Svelte action to place on the disclosure's contents. */
		panel,
		/** Opens the disclosure. */
		open() {
			state.open();
		},
		/** Closes the disclosure. */
		close() {
			state.close();
		},
		/** Toggles the current state of the discolure. */
		toggle() {
			state.toggle();
		},
		/** Whether the disclosure is currently open. */
		get expanded() {
			return state.expanded;
		},
		/** Provides access to the internal `Disclosure` class where the state lives.
		 *  This is useful for updating other state, for example `label`.
		 */
		state
	};
}
