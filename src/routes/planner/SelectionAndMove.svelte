<script lang="ts">
	import { getEditorContext } from "./Canvas.svelte";

	type Props = {
		id: string;
	};
	import { getHighestContrast } from "$lib/apca";
	let { id }: Props = $props();
	let editor = getEditorContext();
	let thisEl = $derived(editor.getElement(id));
	let isSelected = $derived(editor.isElementSelected(id));
	let selectedBy = $derived(editor.getSelectedBy(id));
</script>

{#if thisEl}
	<div
		class="pointer-events-none absolute inset-0 ring-[length:2px/var(--editor-zoom)] {isSelected
			? 'ring-[color:--user-selection-color]'
			: editor.isElementSelectable(thisEl)
				? 'ring-[color:--selected-color] hover:ring-[color:--user-selection-color]'
				: 'ring-[color:--selected-color]'}"
		style:--editor-zoom={editor.zoom.animated * editor.getScale(id)}
		style:--selected-color={selectedBy?.color.rgb ?? "transparent"}
		style:--user-selection-color={editor.room.user.color.rgb}
	>
		<div class="relative -top-2 flex -translate-y-full flex-row gap-1">
			{#if selectedBy && selectedBy.uuid !== editor.room.userUuid}
				<div
					class="grid size-7 place-items-center rounded-full text-base font-bold"
					style:color={getHighestContrast(
						["#ffffff", "#000000"],
						selectedBy.color.rgbOnBackground("#1e293b")
					)}
					style:background={selectedBy.color.rgb}
				>
					<span>{selectedBy.username[0]}</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
