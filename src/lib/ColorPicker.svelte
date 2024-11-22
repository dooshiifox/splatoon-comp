<script lang="ts">
	import { clamp } from "$lib";
	import { getHighestContrast } from "./apca";
	import type { Color } from "./color.svelte";
	import ColorSlider from "./ColorSlider.svelte";
	import { applyBehaviors } from "./headlessui/internal/behavior.svelte";
	import { listenerBehavior } from "./headlessui/internal/events";

	type Props = {
		color: Color;
		predefined: Array<string>;
	};

	let { color = $bindable(), predefined = [] }: Props = $props();

	let picker: HTMLDivElement;
	let isMouseDownPicker = $state(false);
	function changePickerValue(e: { clientX: number; clientY: number }) {
		if (!picker) return;
		const rect = picker.getBoundingClientRect();
		color.s = clamp((e.clientX - rect.left) / rect.width, 0, 1);
		color.v = clamp((rect.height + rect.top - e.clientY) / rect.height, 0, 1);
	}
	function onMouseDownPicker(e: MouseEvent) {
		if (e.button === 0) {
			isMouseDownPicker = true;
			changePickerValue(e);
		}
	}
	function onMouseMove(e: MouseEvent) {
		if (isMouseDownPicker) changePickerValue(e);
	}
	function onMouseUp() {
		isMouseDownPicker = false;
	}
	$effect(() =>
		applyBehaviors(picker, [
			listenerBehavior("touchstart", onTouchPicker, { passive: false }),
			listenerBehavior("touchmove", onTouchPicker, { passive: false }),
			listenerBehavior("touchend", onTouchPicker, { passive: false })
		])
	);
	function onTouchPicker(e: TouchEvent) {
		e.preventDefault();
		changePickerValue(e.changedTouches[0]);
	}
</script>

<svelte:window onmouseup={onMouseUp} onmousemove={onMouseMove} />

<div
	class="flex w-full flex-row gap-2"
	style:--picker-current-color={color.rgb}
	style:--picker-pure-hue={color.pureHue()}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="canvas relative size-32 rounded" bind:this={picker} onmousedown={onMouseDownPicker}>
		<div
			class="absolute size-2 -translate-x-1/2 translate-y-1/2 rounded-full border border-white bg-[color:--picker-current-color] shadow"
			style:bottom="{color.v * 100}%"
			style:left="{color.s * 100}%"
		></div>
	</div>

	<div class="self-stretch">
		<ColorSlider {color} type="h" orientation="vertical" />
	</div>

	<div class="flex grow flex-col gap-4">
		<div class="alpha-bg w-[calc(9ch+24px)] self-center rounded-md font-mono font-bold">
			<input
				class="w-full rounded py-2 text-center outline-none ring-0"
				type="input"
				value={color.rgb}
				style:color={getHighestContrast(["#ffffff", "#000000"], color.rgbOnBackground("#eee"))}
				style:background={color.rgb}
				oninput={(e) => (color.rgb = e.currentTarget.value)}
				onblur={(e) => (e.currentTarget.value = color.rgb)}
			/>
		</div>

		<div
			class="grid grow grid-cols-[repeat(auto-fit,minmax(24px,1fr))] items-center justify-center gap-2"
		>
			{#each predefined as pre (pre)}
				<button
					onclick={() => (color.rgb = pre)}
					class="aspect-square rounded {color.rgb === pre
						? 'ring-2 ring-offset-2 focus-visible:ring-4 focus-visible:ring-offset-0'
						: ''} ring-blue-500 ring-offset-gray-800 focus:outline-none focus-visible:ring-2"
					style:background={pre}
					aria-label="Set color"
				>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.canvas {
		background: linear-gradient(#fff0, #000), linear-gradient(0.25turn, #fff, #0000),
			var(--picker-pure-hue, #ff0000);
	}

	.alpha-bg {
		background:
			linear-gradient(45deg, #ddd 25%, #0000 25%, #0000 75%, #ddd 75%) 0 0 / 12px 12px,
			linear-gradient(45deg, #ddd 25%, #0000 25%, #0000 75%, #ddd 75%) 6px 6px / 12px 12px,
			white;
	}
</style>
