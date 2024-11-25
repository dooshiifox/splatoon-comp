<script module lang="ts">
	export type CommandEntry<T extends string> = {
		readonly key: T;
		readonly name: string;
		readonly desc: string;
		readonly alias: ReadonlyArray<string>;
	};

	type Props<T extends string> = {
		open: boolean;
		readonly actions: ReadonlyArray<CommandEntry<T>>;
		readonly onSelect: (action: T) => void;
	};
</script>

<script lang="ts" generics="const T extends string">
	import { createCombobox } from "$lib/headlessui";
	import { filterByString, SEARCH_PRIORITIES } from "albtc";

	let { open = $bindable(), actions, onSelect }: Props<T> = $props();

	let filter = $state("");
	const filtered = $derived(
		// @ts-expect-error actions is not actually mutated by this fn, just typing error.
		filterByString(filter ?? "", actions, (t) =>
			[
				{
					value: t.name,
					bias: 3,
					minPriority: SEARCH_PRIORITIES.CHARACTERS_IN_ORDER
				},
				{
					value: t.desc,
					bias: 1,
					minPriority: SEARCH_PRIORITIES.CHARACTERS_IN_ORDER
				},
				t.alias.map((v) => ({
					value: v,
					bias: 6,
					minPriority: SEARCH_PRIORITIES.STARTS_WITH
				}))
			].flat()
		).map((v) => ({
			value: v,
			disabled: false,
			text: undefined
		}))
	);
	const combobox = createCombobox<CommandEntry<T>>({
		label: "Actions",
		get expanded() {
			return open;
		},
		set expanded(val) {
			open = val;
		},
		get selected() {
			return [];
		},
		set selected(val) {
			// Noop. A value should never be selected.
		},
		get filter() {
			return filter;
		},
		set filter(val) {
			filter = val;
		},
		get items() {
			return filtered;
		},
		onselect(value) {
			onSelect(value[0].key);
		},
		focusOnFilterChange: "first"
	});
</script>

<div
	class="transition-ease-in absolute left-1/2 top-4 z-10 w-[32rem] -translate-x-1/2 overflow-hidden rounded-xl border-b border-gray-800 bg-gray-900 shadow-xl transition-opacity md:border {combobox.expanded
		? 'opacity-100 duration-0'
		: 'pointer-events-none opacity-0 duration-100'}"
	ontransitionend={() => {
		if (!combobox.expanded) {
			combobox.reset();
			(combobox.state.input as HTMLInputElement).value = "";
		}
	}}
>
	<div class="p-2">
		<input
			use:combobox.input
			class="w-full rounded border border-gray-700 bg-transparent px-4 py-2 text-xl font-bold text-white focus:border-gray-500 focus:ring-0"
		/>
	</div>

	<ul use:combobox.list class="mt-1 max-h-96 w-full overflow-auto">
		{#each combobox.items as { value: entry } (entry.key)}
			{@const active = combobox.isActive(entry)}

			<li
				class="relative cursor-default select-none rounded px-4 py-2"
				class:bg-gray-700={active}
				use:combobox.list_item={entry}
			>
				<span
					class="block truncate text-base text-gray-200"
					class:text-white={active}
					class:font-bold={active}>{entry.name}</span
				>
				{#if entry.desc !== "" && active}
					<span class="block text-sm text-gray-300">{entry.desc}</span>
				{/if}
				{#if entry.alias.length > 0 && active}
					<span class="block text-xs text-gray-300">Alias: {entry.alias[0]}</span>
				{/if}
			</li>
		{/each}
	</ul>
</div>
