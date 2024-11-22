import { tweened } from "svelte/motion";

type TweenedOptions<T> = {
	delay?: number;
	duration?: number | ((from: T, to: T) => number);
	easing?: (t: number) => number;
	interpolate?: (a: T, b: T) => (t: number) => T;
};
export function tweenedState<T>(value: T, defaults: TweenedOptions<T> = {}) {
	let _target = $state(value);
	let current = $state(value);
	const store = tweened(value, defaults);
	$effect(() => store.subscribe((c) => (current = c)));

	return {
		get animated() {
			return current;
		},
		get target() {
			return _target;
		},
		setValue(target: T, opts?: TweenedOptions<T>) {
			_target = target;
			store.set(target, opts);
		}
	};
}
