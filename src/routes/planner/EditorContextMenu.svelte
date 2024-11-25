<script lang="ts">
	import { createMenu, Transition } from "$lib/headlessui";
	import { SvelteSet } from "svelte/reactivity";
	import { getEditorContext } from "./Canvas.svelte";
	import { Color } from "$lib/color.svelte";

	const editor = getEditorContext();

	const menu = createMenu({
		label: "Actions",
		onselect(value) {
			if (value[0] === "add-text") {
				editor.addElement({
					ty: {
						type: "text",
						content: "",
						color: Color.fromRgb("#ffffff")!,
						font: {
							font_type: "sans",
							custom_font_family: "splatoon-text"
						},
						align: "center",
						size: 30,
						background_blur: 0,
						background_color: Color.fromRgb("#00000000")!
					},
					x: editor.toCanvasSpaceX(position.x),
					y: editor.toCanvasSpaceY(position.y),
					tags: new SvelteSet(["items"])
				});
			}
		}
	});

	let position = $state({ x: 0, y: 0 });
	$effect(() =>
		editor.subscribe("context-menu-open", (pos) => {
			menu.open();
			position = pos;
		})
	);
	$effect(() =>
		editor.subscribe("context-menu-close", () => {
			menu.close();
		})
	);
</script>

<Transition
	show={menu.expanded}
	enter="transition ease-out duration-100"
	enterFrom="transform opacity-0 scale-95"
	enterTo="transform opacity-100 scale-100"
	leave="transition ease-in duration-75"
	leaveFrom="transform opacity-100 scale-100"
	leaveTo="transform opacity-0 scale-95"
>
	<div
		use:menu.items
		class="absolute w-56 origin-top-left divide-y divide-gray-700 rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
		style:left="{position.x}px"
		style:top="{position.y}px"
	>
		<div class="px-1 py-1">
			<button
				use:menu.item={{ value: "add-text" }}
				class="flex w-full items-center rounded-md px-2 py-1 text-lg {menu.isActive('add-text')
					? 'bg-slate-600 font-bold text-white'
					: 'text-gray-200'}"
			>
				<!-- <Check class="mr-2 size-5" /> -->
				Add Text
			</button>
		</div>
	</div>
</Transition>
