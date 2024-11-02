// convince TS that the property we checked does then exist!
export function hasOwnProperty<X extends object, Y extends PropertyKey>(
	obj: X,
	prop: Y
): obj is X & Record<Y, unknown> {
	return prop in obj;
}

export function isDisabled(node: HTMLElement) {
	return hasOwnProperty(node, "disabled")
		? node.hasAttribute("disabled")
		: node.getAttribute("disabled") === "true";
}

export function noop() {}
export async function asyncnoop() {}

let count = 0;
export function setUniqueNodeId(node: HTMLElement, prefix: string) {
	if (node.id === "") {
		node.id = `${prefix}:${++count}`;
	}
	return node;
}


/** Actions may have a stateful `option` or they may call `update` to update
 *  their options. This function returns a helper that manages that state.
 *
 *  ```ts
 *  function myAction(node: HTMLElement, options: { readonly someValue: string }) {
 *    const option = getActionOption(() => options.someValue);
 *
 *    // ...
 *
 *    return {
 *      update(newOptions: { readonly someValue: string }) {
 *        option.update(() => newOptions.someValue);
 *      },
 *      destroy() {
 *        option.destroy();
 *      }
 *    }
 *  }
 */
export function getActionOption<T>(getValue: () => T) {
	let value = $state(getValue());
	let unsub = $effect.root(() => {
		$effect(() => {
			value = getValue();
		});
	});
	return {
		get value() {
			return value;
		},
		update(newGetValue: () => T) {
			unsub();
			unsub = $effect.root(() => {
				$effect(() => {
					value = newGetValue();
				});
			});
		},
		destroy() {
			unsub();
		}
	};
}

