<script lang="ts">
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
		type Location,
		locationCommandPalette
	} from "./locations";
	import TW from "$lib/s3/TW.svelte";
	import SZ from "$lib/s3/SZ.svelte";
	import TC from "$lib/s3/TC.svelte";
	import RM from "$lib/s3/RM.svelte";
	import CB from "$lib/s3/CB.svelte";
	import type { Editor as TEditor } from "./editor.svelte";
	import { untrack } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { applyBehaviors } from "$lib/headlessui/internal/behavior.svelte";
	import { listenerBehavior } from "$lib/headlessui/internal/events";
	import CommandPalette from "./CommandPalette.svelte";
	import { strAfter, strStartsWith } from "$lib";
	import { unreachable } from "albtc";
	import { queryParameters } from "sveltekit-search-params";

	function getCurrentSelected() {
		const params = queryParameters({
			map: {
				encode(value) {
					return isMapName(value) ? value : "ScorchGorge";
				},
				decode(value) {
					return isMapName(value) ? value : "ScorchGorge";
				},
				defaultValue: "ScorchGorge"
			},
			mode: {
				encode(value) {
					return isGamemode(value) ? value : "TW";
				},
				decode(value) {
					return isGamemode(value) ? value : "TW";
				},
				defaultValue: "TW"
			},
			view: {
				encode(value) {
					return value === "mini" ? "mini" : "over";
				},
				decode(value) {
					return value === "mini" ? "mini" : "over";
				},
				defaultValue: "over"
			}
		});

		let currentMap = $derived(isMapName(params.map) ? params.map : "ScorchGorge");
		let currentMode = $derived(isGamemode(params.mode) ? params.mode : "TW");

		return {
			get map() {
				return currentMap;
			},
			set map(map: MapName) {
				params.map = map;
			},
			get mapInfo() {
				return LOCATIONS[currentMap];
			},
			get mode() {
				return currentMode;
			},
			set mode(mode: Gamemode) {
				params.mode = mode;
			},
			get modeLocations(): Array<Location> {
				return LOCATIONS[currentMap].gamemodes[currentMode];
			},
			get isMinimap() {
				return params.view === "mini";
			},
			set isMinimap(isMinimap: boolean) {
				params.view = isMinimap ? "mini" : "over";
			}
		};
	}

	let editor = $state<TEditor>();
	let backgroundId: string;
	const current = getCurrentSelected();
	let image = $derived(getStageImage(current.mapInfo.id, current.mode, current.isMinimap));

	const mapDropdown = createListbox<MapLocations & { key: MapName }>({
		label: "Map",
		get selected() {
			return [{ ...current.mapInfo, key: current.map }];
		},
		set selected(val) {
			if (val[0] === undefined) return;
			current.map = val[0].key;
		},
		items: Object.entries(LOCATIONS).map(([k, v]) => ({ value: { key: k as MapName, ...v } })),
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

	let commandPaletteOpen = $state(false);
	function onKeyDown(e: KeyboardEvent) {
		if (e.ctrlKey && e.code === "KeyM") {
			current.isMinimap = !current.isMinimap;
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if (e.ctrlKey && e.code === "KeyP") {
			commandPaletteOpen = !commandPaletteOpen;
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	}

	const commandPaletteActions = [
		{
			key: "tw",
			name: "Switch to Turf War",
			desc: "Change the current map to the Turf War gamemode.",
			alias: ["TW", "Turf", "Turf War"]
		},
		{
			key: "sz",
			name: "Switch to Splat Zones",
			desc: "Change the current map to the Splat Zones gamemode.",
			alias: ["SZ", "Zones", "Splat Zones"]
		},
		{
			key: "tc",
			name: "Switch to Tower Control",
			desc: "Change the current map to the Tower Control gamemode.",
			alias: ["TC", "Tower", "Tower Control"]
		},
		{
			key: "rm",
			name: "Switch to Rainmaker",
			desc: "Change the current map to the Rainmaker gamemode.",
			alias: ["RM", "Rain", "Rainmaker"]
		},
		{
			key: "cb",
			name: "Switch to Clam Blitz",
			desc: "Change the current map to the Clam Blitz gamemode.",
			alias: ["CB", "Clams", "Clam Blitz"]
		},
		...locationCommandPalette,
		{
			key: "mini",
			name: "Switch to Minimap View",
			desc: "Change to the minimap view of the current map. Alternatively, use the Ctrl+M keyboard shortcut.",
			alias: ["mini", "minimap"]
		},
		{
			key: "over",
			name: "Switch to Overhead View",
			desc: "Change to the overhead view of the current map. Alternatively, use the Ctrl+M keyboard shortcut.",
			alias: ["over", "overhead"]
		}
	] as const;
	function onCommandPaletteAction(action: (typeof commandPaletteActions)[number]["key"]) {
		console.debug("Command Palette action selected:", action);
		if (action === "tw") {
			current.mode = "TW";
		} else if (action === "sz") {
			current.mode = "SZ";
		} else if (action === "tc") {
			current.mode = "TC";
		} else if (action === "rm") {
			current.mode = "RM";
		} else if (action === "cb") {
			current.mode = "CB";
		} else if (strStartsWith(action, "map-")) {
			current.map = strAfter(action, "map-");
		} else if (strStartsWith(action, "tw-")) {
			current.map = strAfter(action, "tw-");
			current.mode = "TW";
		} else if (strStartsWith(action, "sz-")) {
			current.map = strAfter(action, "sz-");
			current.mode = "SZ";
		} else if (strStartsWith(action, "tc-")) {
			current.map = strAfter(action, "tc-");
			current.mode = "TC";
		} else if (strStartsWith(action, "rm-")) {
			current.map = strAfter(action, "rm-");
			current.mode = "RM";
		} else if (strStartsWith(action, "cb-")) {
			current.map = strAfter(action, "cb-");
			current.mode = "CB";
		} else if (action === "mini") {
			current.isMinimap = true;
		} else if (action === "over") {
			current.isMinimap = false;
		} else {
			unreachable(action);
		}
	}

	$effect(() => {
		return applyBehaviors(document as unknown as HTMLElement, [
			listenerBehavior("keydown", onKeyDown, { passive: false })
		]);
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
		class="absolute left-0 right-0 top-0 z-10 border-b border-gray-800 bg-gray-900 md:left-4 md:top-4 md:w-80 md:rounded-xl md:border"
	>
		<div class="relative z-10 m-2">
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
							<span class="block truncate {isSelected || isActive ? 'font-bold' : 'font-normal'}">
								{name}
							</span>
						</li>
					{/each}
				</ul>
			</Transition>
		</div>

		<div class="m-2 mt-0 flex flex-row justify-between md:flex-col">
			<fieldset class="flex flex-row md:gap-2">
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

			<div class="mx-4 my-2 flex items-center md:w-full">
				<input
					id="minimap"
					type="checkbox"
					class="size-5 rounded bg-slate-200 text-blue-500"
					bind:checked={current.isMinimap}
				/>
				<label for="minimap" class="hidden flex-1 pl-4 text-lg font-bold text-gray-200 md:inline"
					>Minimap</label
				>
			</div>
		</div>
	</div>

	<CommandPalette
		bind:open={commandPaletteOpen}
		actions={commandPaletteActions}
		onSelect={onCommandPaletteAction}
	/>

	{#if editor}
		<div
			class="absolute right-4 top-4 z-10 hidden w-fit rounded-xl border border-gray-800 bg-gray-900 md:block"
			onwheel={(e) => e.stopPropagation()}
		>
			<p class="mx-4 my-1 font-mono text-lg text-gray-200">
				{(editor.zoom * 100).toFixed(0)}% Zoom
			</p>

			<ul class="mx-4 my-1 flex max-w-60 flex-col gap-y-1 text-base text-gray-200">
				{#snippet key(k: string)}
					<span
						class="mt-0.5 inline-block rounded border-b border-b-gray-500 bg-gray-700 px-2 pt-px font-mono text-xs text-gray-200"
						>{k}</span
					>
				{/snippet}
				<li class="flex flex-row items-center gap-1">
					{@render key("Space")} + {@render key("L-Click")} + Drag - Pan
				</li>
				<li class="flex flex-row items-center gap-1">Scroll - Zoom</li>
				<li class="flex flex-row items-center gap-1">
					{@render key("R-Click")} - Add Item
				</li>
				<li class="flex flex-row items-center gap-1">
					{@render key("Ctrl")} + {@render key("P")} - Command Palette
				</li>
				<li class="flex flex-row items-center gap-1">
					{@render key("Ctrl")} + {@render key("M")} - Toggle Minimap
				</li>
			</ul>
		</div>
	{/if}
</div>
