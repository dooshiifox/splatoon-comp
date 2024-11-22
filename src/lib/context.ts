import { getContext, hasContext, setContext } from "svelte";

export function createContext<T>(key: string) {
	return {
		set(data: T) {
			setContext(key, data);
		},
		get() {
			return getContext<T>(key);
		},
		has() {
			return hasContext(key);
		}
	};
}
