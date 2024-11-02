import {
	reflectAriaLabel,
	reflectAriaModal,
	setRole
} from "./internal/aria.svelte";
import { applyBehaviors } from "./internal/behavior.svelte";
import { onClickOutside, onKeydown } from "./internal/events";
import { trapFocusOnOpen } from "./internal/focus.svelte";
import { keyEscape } from "./internal/key";
import type { Expandable, Labelable } from "./internal/types";
import { setUniqueNodeId } from "./internal/utils.svelte";

export type DialogConfig = Expandable & Labelable;

export type CreatedDialog = ReturnType<typeof createDialog>;

class Dialog implements DialogConfig {
	label = $state("");
	controls = $state("");
	button = $state("");
	panel = $state("");

	expanded_ = $state(false);
	private hasBeenOpened = $state(false);
	get expanded() {
		return this.expanded_;
	}
	set expanded(val) {
		this.expanded_ = val;
		this.hasBeenOpened = this.hasBeenOpened || val;
	}

	get opened() {
		return this.hasBeenOpened;
	}

	constructor(init?: Partial<DialogConfig>) {
		this.reinit(init);
	}

	reinit(init?: Partial<DialogConfig>) {
		this.label = init?.label ?? this.label;
		this.expanded_ = init?.expanded ?? this.expanded;
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

/** A managed, renderless dialog component with accessibility and keyboard
 *  features.
 * 
 *  - [Documentation](https://captaincodeman.github.io/svelte-headlessui/dialog)
 *  - [Example](https://captaincodeman.github.io/svelte-headlessui/example/dialog)
 */
export function createDialog(init?: Partial<DialogConfig>) {
	const prefix = "headlessui-dialog";

	const state = new Dialog(init);

	function modal(node: HTMLElement) {
		setUniqueNodeId(node, prefix);

		const destroy = applyBehaviors(node, [
			setRole("dialog"),
			reflectAriaModal(state),
			reflectAriaLabel(state),
			trapFocusOnOpen(state),
			onClickOutside(() => [node], () => state.close()),
			onKeydown(keyEscape(() => state.close()))
		]);

		return {
			destroy
		};
	}

	return {
		/** A Svelte action to place on the modal contents. */
		modal,
		/** Opens the modal. */
		open() {
			state.open();
		},
		/** Closes the modal. */
		close() {
			state.close();
		},
		/** Whether the modal is currently opened. */
		get expanded(): boolean {
			return state.expanded;
		},
		/** Provides access to the internal `Dialog` class where the state lives.
		 *  This is useful for updating other state, for example `label`.
		 */
		state
	};
}
