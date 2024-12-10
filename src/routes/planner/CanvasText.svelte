<script lang="ts">
	import { untrack } from "svelte";
	import { getEditorContext } from "./Canvas.svelte";
	import { getHighestContrast } from "$lib/apca";
	import SelectionAndMove from "./SelectionAndMove.svelte";

	type Props = {
		id: string;
	};
	let { id }: Props = $props();
	let editor = getEditorContext();

	let thisEl = $derived(editor.getElement(id, "text"));

	let width = $state(0);
	let height = $state(0);

	let el = $state<HTMLTextAreaElement>();
	$effect(() =>
		untrack(() => {
			if (editor.queuedFocus === id) {
				el?.focus();
			}
		})
	);

	let fontFamily = $derived(
		{
			sans: "font-sans",
			mono: "font-mono",
			"splatoon-block": "font-splatoon-block",
			"splatoon-text": "font-splatoon-text"
		}[thisEl.ty.font.custom_font_family ?? thisEl.ty.font.font_type]
	);
	function onKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			el?.blur();
		}
	}
	function onBlur() {
		if (el === undefined) return;

		if (el.value !== "") {
			editor.updateElements([{ uuid: id, ty: { ...thisEl.ty, content: el.value } }]);
			editor.deselectElement(id);
		} else {
			editor.deleteElement(id);
		}
	}

	let isEditable = $derived(editor.isOnlyElementSelected(id) && editor.isEditable([id]));

	// svelte-ignore state_referenced_locally
	let value = $state(thisEl.ty.content);
	$effect(() => {
		value = thisEl.ty.content;
	});
	let textShadow = $derived(getHighestContrast(thisEl.ty.color.rgb, ["#ffffff", "#000000"]));
</script>

<div
	class="contain-[size_layout] absolute"
	class:pointer-events-none={!editor.isElementSelectable(id)}
	style:top="{thisEl.y}px"
	style:left="{thisEl.x}px"
	style:--editor-zoom={editor.zoom.animated * editor.getScale(id)}
	style:z-index={thisEl.z_index}
	style:transform={editor.calculateElementTransform(id)}
	style:width="{width + 8}px"
	style:height="{height + 8}px"
	data-id={id}
>
	<SelectionAndMove {id} />

	<textarea
		bind:this={el}
		class="text-shadow size-full resize-none overflow-hidden border-0 bg-transparent p-0 pl-0.5 pt-0.5 text-center align-top text-2xl outline-none !ring-0 {fontFamily}"
		class:pointer-events-none={!isEditable}
		style:color={thisEl.ty.color.rgb}
		style:--text-shadow={textShadow}
		onkeydown={onKeyDown}
		onblur={onBlur}
		readonly={!isEditable}
		bind:value
	></textarea>

	<p
		class="pointer-events-none absolute left-0 top-0 select-none whitespace-pre text-center text-2xl opacity-0 {fontFamily}"
		bind:clientHeight={height}
		bind:clientWidth={width}
	>
		{value.replaceAll("\n\n", "\nI\n").replace(/^\n/, "I\n").replace(/\n$/, "\nI") || "I"}
	</p>
</div>

<style>
	.text-shadow {
		--offset-amount: 1px;
		/* -webkit-text-stroke: calc(var(--offset-amount) / var(--editor-zoom)) var(--text-shadow); */
		text-shadow:
			calc(var(--offset-amount) / var(--editor-zoom))
				calc(var(--offset-amount) / var(--editor-zoom)) var(--text-shadow),
			calc(-1 * var(--offset-amount) / var(--editor-zoom))
				calc(var(--offset-amount) / var(--editor-zoom)) var(--text-shadow),
			calc(var(--offset-amount) / var(--editor-zoom))
				calc(-1 * var(--offset-amount) / var(--editor-zoom)) var(--text-shadow),
			calc(-1 * var(--offset-amount) / var(--editor-zoom))
				calc(-1 * var(--offset-amount) / var(--editor-zoom)) var(--text-shadow);
	}
</style>
