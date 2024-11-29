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

		{#if isSelected}
			<div
				class="pointer-events-auto absolute -bottom-1 -right-1 size-6 translate-x-full translate-y-full rounded bg-gray-200 p-0.5 text-gray-800"
				data-move="true"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="pointer-events-none size-5"
				>
					<path
						d="M5.80025 7.52513C5.80025 7.32621 5.72123 7.13545 5.58058 6.9948C5.43993 6.85414 5.24916 6.77513 5.05025 6.77513C4.85134 6.77513 4.66057 6.85414 4.51992 6.9948L2.04505 9.46967C1.9044 9.61032 1.82538 9.80109 1.82538 10C1.82538 10.1989 1.9044 10.3897 2.04505 10.5303L4.51992 13.0052C4.66057 13.1459 4.85134 13.2249 5.05025 13.2249C5.24917 13.2249 5.43993 13.1459 5.58058 13.0052C5.72124 12.8646 5.80025 12.6738 5.80025 12.4749C5.80025 12.276 5.72123 12.0852 5.58058 11.9445L4.38557 10.7495L9.25047 10.7495V15.6144L8.05546 14.4194C7.9148 14.2788 7.72404 14.1997 7.52513 14.1997C7.32621 14.1997 7.13545 14.2788 6.9948 14.4194C6.85414 14.5601 6.77513 14.7508 6.77513 14.9497C6.77513 15.1487 6.85414 15.3394 6.9948 15.4801L9.46967 17.955C9.61032 18.0956 9.80109 18.1746 10 18.1746C10.1989 18.1746 10.3897 18.0956 10.5303 17.955L13.0052 15.4801C13.1459 15.3394 13.2249 15.1487 13.2249 14.9497C13.2249 14.7508 13.1459 14.5601 13.0052 14.4194C12.8646 14.2788 12.6738 14.1997 12.4749 14.1997C12.276 14.1997 12.0852 14.2788 11.9445 14.4194L10.7495 15.6144L10.7495 10.7495L15.6144 10.7495L14.4194 11.9445C14.2788 12.0852 14.1997 12.276 14.1997 12.4749C14.1997 12.6738 14.2788 12.8646 14.4194 13.0052C14.5601 13.1459 14.7508 13.2249 14.9497 13.2249C15.1487 13.2249 15.3394 13.1459 15.4801 13.0052L17.955 10.5303C18.0956 10.3897 18.1746 10.1989 18.1746 10C18.1746 9.80109 18.0956 9.61032 17.955 9.46967L15.4801 6.9948C15.3394 6.85414 15.1487 6.77513 14.9497 6.77513C14.7508 6.77513 14.5601 6.85414 14.4194 6.9948C14.2788 7.13545 14.1997 7.32621 14.1997 7.52513C14.1997 7.72404 14.2788 7.9148 14.4194 8.05546L15.6144 9.25047H10.7495L10.7495 4.38557L11.9445 5.58058C12.0852 5.72124 12.276 5.80025 12.4749 5.80025C12.6738 5.80025 12.8646 5.72124 13.0052 5.58058C13.1459 5.43993 13.2249 5.24917 13.2249 5.05025C13.2249 4.85134 13.1459 4.66057 13.0052 4.51992L10.5303 2.04505C10.3897 1.9044 10.1989 1.82538 10 1.82538C9.80109 1.82538 9.61032 1.9044 9.46967 2.04505L6.9948 4.51992C6.70205 4.81267 6.70205 5.28784 6.9948 5.58058C7.13545 5.72124 7.32621 5.80025 7.52513 5.80025C7.72404 5.80025 7.9148 5.72124 8.05546 5.58058L9.25047 4.38557L9.25047 9.25047H4.38557L5.58058 8.05546C5.72123 7.9148 5.80025 7.72404 5.80025 7.52513Z"
					/>
				</svg>
			</div>
		{/if}
	</div>
{/if}
