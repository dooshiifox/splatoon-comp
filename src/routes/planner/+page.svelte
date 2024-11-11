<script lang="ts">
	import { page } from "$app/stores";
	import { createListbox } from "$lib/headlessui";
	import Transition from "$lib/headlessui/Transition.svelte";
	import Check from "$lib/icons/Check.svelte";
	import Editor from "./Editor.svelte";
	import {
		isGamemode,
		type Gamemode,
		type MapName,
		isMapName,
		getStageImage,
		LOCATIONS,
		type MapLocations,
		GAMEMODES,
		type Transform,
		type Location
	} from "./locations";
	import { goto } from "$app/navigation";
	import TW from "$lib/s3/TW.svelte";
	import SZ from "$lib/s3/SZ.svelte";
	import TC from "$lib/s3/TC.svelte";
	import RM from "$lib/s3/RM.svelte";
	import CB from "$lib/s3/CB.svelte";
	import type { Editor as TEditor } from "./editor.svelte";
	import { untrack } from "svelte";
	import { SvelteSet } from "svelte/reactivity";

	function getCurrentSelected() {
		let currentMap: MapName = $derived.by((): MapName => {
			const found = $page.url.searchParams.get("map");
			if (isMapName(found)) return found;
			return "ScorchGorge";
		});
		let currentMode: Gamemode = $derived.by(() => {
			const found = $page.url.searchParams.get("mode");
			if (isGamemode(found)) return found;
			return "TW";
		});
		let currentViewIsMinimap: boolean = $derived($page.url.searchParams.get("view") === "mini");

		return {
			get map() {
				return currentMap;
			},
			set map(map: MapName) {
				const params = new URLSearchParams($page.url.searchParams);
				params.set("map", map);
				goto(`?${params}`);
			},
			get mapInfo() {
				return LOCATIONS[currentMap];
			},
			get mode() {
				return currentMode;
			},
			set mode(mode: Gamemode) {
				const params = new URLSearchParams($page.url.searchParams);
				params.set("mode", mode);
				goto(`?${params}`);
			},
			get modeLocations(): Array<Location> {
				return LOCATIONS[currentMap].gamemodes[currentMode];
			},
			get isMinimap() {
				return currentViewIsMinimap;
			},
			set isMinimap(isMinimap: boolean) {
				const params = new URLSearchParams($page.url.searchParams);
				params.set("view", isMinimap ? "mini" : "over");
				goto(`?${params}`);
			}
		};
	}

	let editor = $state<TEditor>();
	let backgroundId: string;
	const current = getCurrentSelected();
	let image = $derived(getStageImage(current.mapInfo.id, current.mode, current.isMinimap));

	const mapDropdown = createListbox<MapLocations & { key: MapName }>({
		label: "Map",
		selected: [{ ...current.mapInfo, key: current.map }],
		onselect(value) {
			current.map = value[0].key;
		}
	});

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		image;
		untrack(() => {
			if (editor === undefined) return;
			editor.updateElement(backgroundId, {
				url: image
			});
		});
	});

	function transformElement(id: string, transform: Transform, reverse: boolean) {
		const el = editor?.getElement(id);
		if (!el) return;

		const rotationCenter = ((transform.rotation * Math.PI) / 180) * (reverse ? -1 : 1);
		const scale = transform.scale;
		const translateX = transform.translate.x;
		const translateY = transform.translate.y;
		const x = reverse ? el.centerX / scale - translateX : el.centerX;
		const y = reverse ? el.centerY / scale - translateY : el.centerY;
		// calc translation when rotated around center
		const newX = x * Math.cos(rotationCenter) - y * Math.sin(rotationCenter);
		const newY = y * Math.cos(rotationCenter) + x * Math.sin(rotationCenter);

		editor?.updateElement(id, {
			centerX: reverse ? newX : (newX + translateX) * scale,
			centerY: reverse ? newY : (newY + translateY) * scale
		});
	}

	$effect(() => {
		if (!editor) return;
		const mapCombo = current.map + current.mode + untrack(() => editor?.genId());

		untrack(() => {
			for (const location of current.modeLocations) {
				if (location.type === "callout") {
					editor?.addElement({
						centerX: location.x,
						centerY: location.y,
						type: "text",
						color: "#dddb6b",
						content: location.content,
						font: "splatoon-text",
						groups: new SvelteSet(["items", mapCombo, "callout"]),
						selectable: false,
						zIndex: 100
					});
				}
			}
		});

		return () =>
			untrack(() => {
				for (const el of editor?.getElementsInGroup(mapCombo) ?? []) {
					editor?.deleteElement(el.id);
				}
			});
	});

	$effect(() => {
		if (!editor) return;
		const transform =
			current.isMinimap && current.mapInfo.minimap
				? current.mapInfo.minimap
				: { rotation: 0, scale: 1, translate: { x: 0, y: 0 } };
		const mapCombo = current.map + current.mode + untrack(() => editor?.genId());

		untrack(() => {
			for (const el of editor?.getElementsInGroup("items") ?? []) {
				transformElement(el.id, transform, false);
				el.groups.add("transform-" + mapCombo);
			}
		});

		// Reset
		return () =>
			untrack(() => {
				for (const el of editor?.getElementsInGroup("transform-" + mapCombo) ?? []) {
					transformElement(el.id, transform, true);
				}
			});
	});
</script>

<svelte:head>
	<title>Planning {current.mode} {current.mapInfo.name}</title>
</svelte:head>

<div class="relative h-dvh w-dvw overflow-hidden">
	<Editor
		onCreate={(etor) => {
			editor = etor;
			backgroundId = editor.addElement({
				type: "image",
				centerX: 0,
				centerY: 0,
				url: image,
				selectable: false,
				zIndex: -100,
				scale: "none"
			});
		}}
	/>

	<div
		class="absolute left-4 top-4 z-10 w-80 rounded-xl border border-gray-800 bg-gray-900"
		onwheel={(e) => e.stopPropagation()}
	>
		<div class="relative z-10 m-2">
			<button
				class="flex w-full flex-col rounded-lg bg-gray-800 px-6 py-1 text-left hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
				use:mapDropdown.button
			>
				<p class="text-lg font-bold text-white">
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
					use:mapDropdown.items
					class="absolute max-h-[40rem] w-full translate-y-1 overflow-auto rounded-lg bg-gray-700 py-1 text-lg font-bold text-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
				>
					{#each Object.entries(LOCATIONS) as [id, info] (id)}
						{@const isActive = mapDropdown.isActive(id as MapName)}
						{@const isSelected = mapDropdown.isSelected(id as MapName)}
						<li
							class="flex cursor-default select-none flex-row items-center py-2 pl-2 pr-6 {isActive
								? 'bg-slate-800 text-white'
								: 'text-gray-200'}"
							use:mapDropdown.item={{ value: { key: id as MapName, ...info } }}
						>
							<div class="mr-2 h-5 w-5">
								{#if isSelected}
									<Check />
								{/if}
							</div>
							<span class="block truncate {isSelected || isActive ? 'font-bold' : 'font-normal'}">
								{info.name}
							</span>
						</li>
					{/each}
				</ul>
			</Transition>
		</div>

		<fieldset class="m-2 mt-0 flex flex-row gap-2">
			{#each GAMEMODES as gamemode}
				<div class="relative aspect-square flex-1">
					<input
						id={gamemode}
						class="peer absolute h-0 w-0 opacity-0"
						type="radio"
						bind:group={current.mode}
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

		<div class="mx-4 my-2 flex w-full items-center">
			<input
				id="minimap"
				type="checkbox"
				class="size-5 rounded bg-slate-200 text-blue-500"
				bind:checked={current.isMinimap}
			/>
			<label for="minimap" class="flex-1 pl-4 text-lg font-bold text-gray-200">Minimap</label>
		</div>
	</div>
</div>
