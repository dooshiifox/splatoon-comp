<script lang="ts">
	import { createListbox, createTabs, Transition } from "$lib/headlessui";
	import Check from "$lib/icons/Check.svelte";
	import { GAMEMODES, LOCATIONS, type MapLocations, type MapName } from "./locations";
	import TW from "$lib/s3/TW.svelte";
	import SZ from "$lib/s3/SZ.svelte";
	import TC from "$lib/s3/TC.svelte";
	import RM from "$lib/s3/RM.svelte";
	import CB from "$lib/s3/CB.svelte";
	import { getPlannerContext } from "./+page.svelte";
	import A from "$lib/mdsvex/a.svelte";
	import CollabTab from "./CollabTab.svelte";
	import Input from "$lib/mdsvex/input.svelte";

	const TABS = ["Map", "Collab", "Help"] as const;
	const tabs = createTabs<(typeof TABS)[number]>({
		items: TABS.map((v) => ({ value: v })),
		label: "Toolbar"
	});

	let ctx = getPlannerContext();
	const mapDropdown = createListbox<MapLocations & { key: MapName }>({
		label: "Map",
		get selected() {
			return [{ ...ctx.map.mapInfo, key: ctx.map.map }];
		},
		set selected(val) {
			if (val[0] === undefined) return;
			ctx.map.map = val[0].key;
		},
		items: Object.entries(LOCATIONS).map(([k, v]) => ({ value: { key: k as MapName, ...v } })),
		onselect(value) {
			ctx.map.map = value[0].key;
		}
	});
</script>

<div
	class="absolute left-0 right-0 top-0 z-10 border-b border-gray-800 bg-gray-900 md:left-4 md:top-4 md:w-80 md:rounded-xl md:border"
>
	<div
		use:tabs.list
		class="flex w-full flex-row items-center justify-center border-b border-gray-800"
	>
		{#each tabs.items as { value } (value)}
			{@const active = tabs.isActive(value)}
			{@const selected = tabs.isSelected(value)}
			<button
				use:tabs.tab={value}
				class="mx-0.5 my-1 flex size-12 flex-col items-center justify-center rounded-xl ring-blue-500 focus:outline-none focus:ring-2 {selected
					? 'bg-slate-800 text-white'
					: active
						? 'bg-slate-700 text-white'
						: 'text-gray-400 hover:bg-slate-700 hover:text-white'}"
			>
				{#if value === "Map" && active}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-6"
					>
						<path
							fill-rule="evenodd"
							d="M8.161 2.58a1.875 1.875 0 0 1 1.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0 1 21.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 0 1-1.676 0l-4.994-2.497a.375.375 0 0 0-.336 0l-3.868 1.935A1.875 1.875 0 0 1 2.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437ZM9 6a.75.75 0 0 1 .75.75V15a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 9 6Zm6.75 3a.75.75 0 0 0-1.5 0v8.25a.75.75 0 0 0 1.5 0V9Z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else if value === "Map"}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
						/>
					</svg>
				{:else if value === "Collab" && active}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-6"
					>
						<path
							fill-rule="evenodd"
							d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
							clip-rule="evenodd"
						/>
						<path
							d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z"
						/>
					</svg>
				{:else if value === "Collab"}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
						/>
					</svg>
				{:else if value === "Help" && active}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-6"
					>
						<path
							fill-rule="evenodd"
							d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 0 1-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 0 1-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else if value === "Help"}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
						/>
					</svg>
				{/if}

				<p class="w-full text-center text-[10px]">{value}</p>
			</button>
		{/each}
	</div>

	<div>
		<div use:tabs.panel={"Map"} class="contents">
			{#if tabs.isSelected("Map")}
				<div class="p-2">
					<div class="relative z-10">
						<button
							class="flex w-full flex-col rounded-lg bg-gray-800 px-6 py-1 text-left hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
							use:mapDropdown.button
						>
							<p class="text-base font-bold text-white md:text-lg">
								{mapDropdown.selected[0].name}
							</p>
						</button>

						<Transition
							show={mapDropdown.expanded}
							leave="transition ease-in duration-100"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<ul
								use:mapDropdown.list
								class="absolute max-h-[min(40rem,80dvh)] w-full translate-y-1 overflow-auto rounded-lg bg-gray-700 py-1 text-base font-bold text-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none md:text-lg"
							>
								{#each mapDropdown.items as { value: { key: id, name } } (id)}
									{@const isActive = mapDropdown.isActive(id as MapName)}
									{@const isSelected = mapDropdown.isSelected(id as MapName)}
									<li
										class="flex cursor-default select-none flex-row items-center py-2 pl-2 pr-6 {isActive
											? 'bg-slate-800 text-white'
											: 'text-gray-200'}"
										use:mapDropdown.list_item={id as MapName}
									>
										<div class="mr-2 h-5 w-5">
											{#if isSelected}
												<Check />
											{/if}
										</div>
										<span
											class="block truncate {isSelected || isActive ? 'font-bold' : 'font-normal'}"
										>
											{name}
										</span>
									</li>
								{/each}
							</ul>
						</Transition>
					</div>

					<div class="flex flex-row justify-between pt-2 md:flex-col">
						<fieldset class="flex flex-row md:gap-2">
							{#each GAMEMODES as gamemode}
								<div class="relative aspect-square flex-1">
									<input
										id={gamemode}
										class="peer absolute h-0 w-0 opacity-0"
										type="radio"
										bind:group={ctx.map.mode}
										name="mode"
										value={gamemode}
									/>
									<label
										for={gamemode}
										class="relative flex h-full cursor-pointer items-center rounded-lg p-2 outline-none peer-checked:bg-slate-800 peer-hover:bg-slate-700 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400"
									>
										{#if gamemode === "TW"}
											<TW class="w-full" />
										{:else if gamemode === "SZ"}
											<SZ class="w-full" />
										{:else if gamemode === "TC"}
											<TC class="w-full" />
										{:else if gamemode === "RM"}
											<RM class="w-full" />
										{:else if gamemode === "CB"}
											<CB class="w-full" />
										{/if}
									</label>
								</div>
							{/each}
						</fieldset>

						<Input
							type="checkbox"
							title="Minimap"
							bind:checked={ctx.map.isMinimap}
							class="mt-2"
							labelClass="max-md:sr-only"
						/>
					</div>
				</div>
			{/if}
		</div>

		<div use:tabs.panel={"Collab"} class="contents">
			{#if tabs.isSelected("Collab")}
				<CollabTab />
			{/if}
		</div>

		<div use:tabs.panel={"Help"} class="contents">
			{#if tabs.isSelected("Help")}
				<div class="px-6 py-2">
					<p class="mx-auto mb-2 w-fit text-base text-gray-200">
						In Alpha. <A href="/planner/todo">View To-Do list</A>
					</p>
					<div class="flex flex-row items-center justify-center *:shrink-0">
						<a
							href="https://github.com/dooshiifox/splatoon-comp"
							target="_blank"
							class="size-8 p-0.5"
						>
							<svg viewBox="0 0 24 24" class="fill-white">
								<title>Github Logo</title>
								<path
									d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"
								></path>
							</svg>
						</a>

						<div class="mx-3 h-5 w-0.5 bg-gray-600"></div>

						<a href="https://bsky.app/profile/dooshii.dev" target="_blank" class="size-8 p-1"
							><img
								src="https://raw.githubusercontent.com/bluesky-social/social-app/refs/heads/main/assets/favicon.png"
								class="size-full"
								alt="Bluesky Logo"
							/></a
						>

						<div class="mx-3 h-5 w-0.5 bg-gray-600"></div>

						<img
							src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/636e0a6ca814282eca7172c6_icon_clyde_white_RGB.svg"
							class="size-6"
							alt="Discord Logo"
						/>
						<p class="ml-2 text-sm text-gray-200">@dooshii</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
