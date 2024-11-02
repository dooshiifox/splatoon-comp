import type { Behavior } from "./types";

export function createWatchBehavior(
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	watch: Behavior
): Behavior {
	return (node) => $effect.root(() => {
		$effect(() => watch(node))
	});
}

export function applyBehaviors(node: HTMLElement, behaviors: Array<Behavior>) {
	const unsubscribes = behaviors.map((behavior) => behavior(node));
	return () => unsubscribes.forEach((unsubscribe) => unsubscribe?.());
}

export function onDestroy(fn: (node: HTMLElement) => void): Behavior {
	return (node) => () => fn(node);
}
