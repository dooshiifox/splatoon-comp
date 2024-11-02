import { createWatchBehavior } from "./behavior.svelte";
import { getKey, isKeySelected } from "./list";
import type {
	Behavior,
	Checkable,
	Controllable,
	Expandable,
	Item,
	Labelable,
	List,
	ListItem,
	Orientable,
	Pressable,
	Selectable
} from "./types";

/** Sets an aria attribute on the node with the given value. */
export function setAriaAttribute(
	name: string,
	node: HTMLElement,
	value?: boolean | string | undefined
) {
	if (value === undefined || value === "") {
		node.removeAttribute(name);
	} else {
		node.setAttribute(name, value.toString());
	}
}

/** Sets an aria attribute on a node with the value given by the `getter`.
 *  The `getter` is automatically watched with `$effect` and so will update
 *  the attribute when the value changes.
 */
export function ariaBehavior(
	name: string,
	getter: (node: HTMLElement) => boolean | string | undefined
): Behavior {
	return createWatchBehavior((node) => {
		setAriaAttribute(name, node, getter(node));
	});
}

export function reflectAriaActivedescendent(store: List<Item>): Behavior {
	return ariaBehavior("aria-activedescendant", () =>
		store.active === null ? "" : store.items[store.active]?.id ?? ""
	);
}

export function reflectAriaChecked(store: Checkable): Behavior {
	return ariaBehavior("aria-checked", () => store.checked);
}

export function reflectAriaControls(store: Controllable): Behavior {
	return ariaBehavior("aria-controls", () => store.controls);
}

export function reflectAriaDisabled<T extends Item>(store: List<T>): Behavior {
	return ariaBehavior(
		"aria-disabled",
		(node) => store.items.find((item) => item.id === node.id)?.disabled
	);
}

export function reflectAriaExpanded(store: Expandable): Behavior {
	return ariaBehavior("aria-expanded", () => store.expanded);
}
export function reflectAriaModal(store: Expandable): Behavior {
	return ariaBehavior("aria-modal", () => store.expanded);
}

export function reflectAriaLabel(store: Labelable): Behavior {
	return ariaBehavior("aria-label", () => store.label);
}

export function reflectAriaOrientation(store: Orientable): Behavior {
	return ariaBehavior("aria-orientation", () => store.orientation);
}

export function reflectAriaPressed(store: Pressable): Behavior {
	return ariaBehavior("aria-pressed", () => store.pressed);
}

export function reflectAriaSelected<T extends Item>(
	store: Selectable<T>,
	value: ListItem<T>
): Behavior {
	return ariaBehavior("aria-selected", () =>
		isKeySelected(store.selected, getKey(value.value))
	);
}

export function reflectAriaMultiselectable(store: {
	readonly multi: boolean;
}): Behavior {
	return ariaBehavior("aria-multiselectable", () => store.multi);
}

export function setHasPopup(): Behavior {
	return ariaBehavior("aria-haspopup", () => true);
}

export function setRole(role: string): Behavior {
	return ariaBehavior("role", () => role);
}

export function setType(type: string): Behavior {
	return ariaBehavior("type", () => type);
}

export function setTabIndex(index = -1): Behavior {
	return (node) => {
		node.tabIndex = index;
	};
}

export function setInputValue(
	node: HTMLInputElement,
	value: string | undefined
) {
	if (value !== undefined && value !== "") {
		node.value = value;
	}
}

export function reflectSelectedValueOnClose<T extends Item>(
	store: Selectable<T> & Expandable,
	selector: (value: Array<T> | null) => string | undefined
): Behavior {
	return createWatchBehavior((node) => {
		setInputValue(
			node as HTMLInputElement,
			selector(
				store.expanded || store.selected.length === 0 ? null : store.selected
			)
		);
	});
}
