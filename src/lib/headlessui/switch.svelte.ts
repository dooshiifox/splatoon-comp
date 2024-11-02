import {
	reflectAriaChecked,
	reflectAriaLabel,
	reflectAriaPressed,
	setRole,
	setTabIndex,
	setType
} from "./internal/aria.svelte";
import { applyBehaviors } from "./internal/behavior.svelte";
import { onClick, onKeydown } from "./internal/events";
import { keySpaceOrEnter } from "./internal/key";
import type { Checkable, Labelable, Pressable } from "./internal/types";
import { setUniqueNodeId } from "./internal/utils.svelte";

export type SwitchConfig = Labelable & Checkable & Pressable;

class Switch implements SwitchConfig {
	label = $state("");
	checked = $state(false);
	pressed = $state(false);

	constructor(init?: Partial<SwitchConfig>) {
		this.reinit(init);
	}

	reinit(init?: Partial<SwitchConfig>) {
		this.label = init?.label ?? this.label;
		this.checked = init?.checked ?? this.checked;
		this.pressed = init?.pressed ?? this.pressed;
	}

	on() {
		this.checked = true;
		this.pressed = true;
	}
	off() {
		this.checked = false;
		this.pressed = false;
	}
	toggle() {
		if (this.checked) {
			this.off();
		} else {
			this.on();
		}
	}
}

/** A toggle-able component, useful for two-state buttons or switches/checboxes.
 *  It comes with accessibility and keyboard controls.
 */
export function createSwitch(init?: Partial<SwitchConfig>) {
	const prefix = "headlessui-switch";

	const state = new Switch(init);

	function button(node: HTMLElement) {
		setUniqueNodeId(node, prefix);

		const destroy = applyBehaviors(node, [
			setType("button"),
			setRole("button"),
			setTabIndex(0),
			reflectAriaPressed(state),
			reflectAriaLabel(state),
			onClick(() => state.toggle()),
			onKeydown(keySpaceOrEnter(() => state.toggle()))
		]);

		return {
			destroy
		};
	}

	function toggle(node: HTMLElement) {
		setUniqueNodeId(node, prefix);

		const destroy = applyBehaviors(node, [
			setType("button"),
			setRole("switch"),
			setTabIndex(0),
			reflectAriaLabel(state),
			reflectAriaChecked(state),
			onClick(() => state.toggle()),
			onKeydown(keySpaceOrEnter(() => state.toggle()))
		]);

		return {
			destroy
		};
	}

	return {
		/** A Svelte action to place on the switch's toggle button to
		 *  toggle between on and off.
		 * 
		 *  Functionally, this is the same as `toggle` and you should only use
		 *  one of these. Use this when you want to use a button instead of a
		 *  switch as they differ in accessibility.
		 */
		button,
		/** A Svelte action to place on the switch's toggle switch to
		 *  toggle between open and closed.
		 * 
		 *  Functionally, this is the same as `button` and you should only use
		 *  one of these. Use this when you want to use a switch instead of a
		 *  button as they differ in accessibility.
		 */
		toggle,
		/** Whether the switch is checked.
		 * 
		 *  Functionally the same as `pressed`.
		 */
		get checked() {
			return state.checked;
		},
		/** Whether the button is pressed.
		 * 
		 *  Functionally the same as `checked`.
		 */
		get pressed() {
			return state.pressed;
		},
		/** Provides access to the internal `Switch` class where the state lives.
		 *  This is useful for updating other state, for example `label`.
		 */
		state
	};
}
