<script module lang="ts">
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

	const plannerContext = createContext<{
		readonly editor: TEditor | undefined;
		readonly map: ReturnType<typeof getCurrentSelected>;
	}>("planner");
	export const getPlannerContext = plannerContext.get;

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
</script>

<script lang="ts">
	import Editor from "./Editor.svelte";
	import {
		isGamemode,
		type Gamemode,
		type MapName,
		isMapName,
		getStageImage,
		LOCATIONS,
		type Transform,
		type Location,
		locationCommandPalette
	} from "./locations";
	import { LOCKED_TAG, NO_SYNC_TAG, type Editor as TEditor } from "./editor.svelte";
	import { untrack } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { applyBehaviors } from "$lib/headlessui/internal/behavior.svelte";
	import { listenerBehavior } from "$lib/headlessui/internal/events";
	import CommandPalette from "./CommandPalette.svelte";
	import { strAfter, strStartsWith } from "$lib";
	import { unreachable } from "albtc";
	import { queryParameters } from "sveltekit-search-params";
	import PageTabs from "./PageTabs.svelte";
	import { createContext } from "$lib/context";
	import { Color } from "$lib/color.svelte";
	import { uuid } from "$lib/uuid";

	let editor = $state<TEditor>();
	let backgroundId: string;
	const current = getCurrentSelected();
	let image = $derived(getStageImage(current.mapInfo.id, current.mode, current.isMinimap));
	plannerContext.set({
		get editor() {
			return editor;
		},
		get map() {
			return current;
		}
	});

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		image;
		untrack(() => {
			if (editor === undefined) return;
			const img = editor.getElement(backgroundId, "image");
			editor.updateElement(backgroundId, {
				ty: {
					...img.ty,
					url: image
				}
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
		const x = reverse ? el.x / scale - translateX : el.x;
		const y = reverse ? el.y / scale - translateY : el.y;
		// calc translation when rotated around center
		const newX = x * Math.cos(rotationCenter) - y * Math.sin(rotationCenter);
		const newY = y * Math.cos(rotationCenter) + x * Math.sin(rotationCenter);

		editor?.updateElement(id, {
			x: reverse ? newX : (newX + translateX) * scale,
			y: reverse ? newY : (newY + translateY) * scale
		});
	}

	$effect(() => {
		if (!editor) return;
		const mapCombo = current.map + current.mode + untrack(() => uuid());

		untrack(() => {
			for (const location of current.modeLocations) {
				if (location.type === "callout") {
					editor?.addElement({
						x: location.x,
						y: location.y,
						ty: {
							type: "text",
							color: Color.fromRgb("#dddb6b")!,
							content: location.content,
							font: {
								font_type: "sans",
								custom_font_family: "splatoon-text"
							},
							align: "center",
							size: 30,
							background_color: Color.fromRgb("#0000")!,
							background_blur: 0
						},
						tags: new SvelteSet(["items", mapCombo, "callout", LOCKED_TAG, NO_SYNC_TAG]),
						z_index: 100
					});
				}
			}
		});

		return () =>
			untrack(() => {
				for (const el of editor?.getElementsInGroup(mapCombo) ?? []) {
					editor?.deleteElement(el.uuid);
				}
			});
	});

	$effect(() => {
		if (!editor) return;
		const transform =
			current.isMinimap && current.mapInfo.minimap
				? current.mapInfo.minimap
				: { rotation: 0, scale: 1, translate: { x: 0, y: 0 } };
		const mapCombo = current.map + current.mode + untrack(() => uuid());

		untrack(() => {
			for (const el of editor?.getElementsInGroup("items") ?? []) {
				transformElement(el.uuid, transform, false);
				el.tags.add("transform-" + mapCombo);
			}
		});

		// Reset
		return () =>
			untrack(() => {
				for (const el of editor?.getElementsInGroup("transform-" + mapCombo) ?? []) {
					transformElement(el.uuid, transform, true);
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
				ty: {
					type: "image",
					alt: "",
					crop: { top: 0, bottom: 0, left: 0, right: 0 },
					outline_blur: 0,
					outline_color: Color.fromRgb("#0000")!,
					outline_thickness: 0,
					scale_x: 1,
					scale_y: 1,
					text: [],
					url: image
				},
				x: 0,
				y: 0,
				z_index: -100,
				scale_rate: "none",
				tags: new SvelteSet([LOCKED_TAG, NO_SYNC_TAG])
			});
		}}
	/>

	<PageTabs />

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
				{(editor.zoom.animated * 100).toFixed(0)}% Zoom
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
