<script lang="ts">
	import type { Color } from "./color.svelte";

	type Props = {
		color: Color;
		type: "h" | "s" | "v" | "a";
		orientation: "vertical" | "horizontal";
	};
	import { clamp, roundToMultipleOf } from "$lib";
	import { unreachable } from "albtc";
	import { applyBehaviors } from "./headlessui/internal/behavior.svelte";
	import { listenerBehavior } from "./headlessui/internal/events";

	let { color = $bindable(), type, orientation }: Props = $props();

	let isHorizontal = $derived(orientation === "horizontal");
	// max value is on bottom / left, instead of top / right
	let isInverted = $derived(!isHorizontal && type === "h");
	const min = 0;
	let max = $derived(type === "h" ? 360 : 100);
	let ariaLabel = $derived.by(() => {
		if (type === "h") return "Adjust hue";
		if (type === "s") return "Adjust saturation";
		if (type === "v") return "Adjust brightness";
		if (type === "a") return "Adjust opacity";
		unreachable(type);
	});
	let ariaValueText = $derived.by(() => {
		if (type === "h")
			return `${Math.round(color.h * max)} degrees, approximately ${color.hueName()}`;
		if (type === "s") {
			if (color.s === 0) {
				return "Completely monochrome";
			} else if (color.s === 1) {
				return "Completely saturated";
			}
			return `${Math.round(color.s * max)}% saturated`;
		}
		if (type === "v") {
			if (color.s === 0) {
				return "Completely black";
			} else if (color.s === 1) {
				return "Maximum brightness";
			}
			return `${Math.round(color.s * max)}% brightness`;
		}
		if (type === "a") {
			if (color.a === 0) {
				return "Completely transparent";
			} else if (color.s === 1) {
				return "Completely opaque";
			}
			return `${Math.round(color.s * max)}% opacity`;
		}
		unreachable(type);
	});

	let width = $state(0);
	let height = $state(0);
	let length = $derived(isHorizontal ? width : height);
	let currentValue = $derived(Math.round(color[type] * max));

	/** `newVal` is from `min` to `max`, not `0` to `1`. */
	function setValue(newVal: number) {
		color[type] = clamp(newVal / max, 0, 1);
	}
	/** Round the given value to the nearest 1. */
	function roundToStep(num: number) {
		// Make sure to account for `min` when rounding.
		// e.g., when `min` is 8 and `step` is 5, 12 should round to 13, not 10.
		return roundToMultipleOf(num - min, 1) + min;
	}

	function onKeyDownSlider(e: KeyboardEvent) {
		switch (e.key) {
			case "ArrowLeft":
			case "ArrowDown":
				setValue(roundToStep(currentValue - 1));
				break;
			case "ArrowRight":
			case "ArrowUp":
				setValue(roundToStep(currentValue + 1));
				break;
			case "PageUp":
				setValue(roundToStep(currentValue + 5));
				break;
			case "PageDown":
				setValue(roundToStep(currentValue - 5));
				break;
			case "Home":
				setValue(min);
				break;
			case "End":
				setValue(max);
				break;
			default:
				return;
		}

		e.preventDefault();
	}

	let handler: HTMLDivElement;
	function onMouseDown(mouseDownEvent: { clientX: number; clientY: number }) {
		if (length === undefined || !handler) return;

		// The position of the mouse relative to the start of the slider.

		const move = (moveEvent: { clientX: number; clientY: number }) => {
			if (length === undefined) return;

			const rec = handler.getBoundingClientRect();
			let pxFromStart;

			if (isHorizontal && isInverted) {
				pxFromStart = rec.right - moveEvent.clientX;
			} else if (isHorizontal) {
				pxFromStart = moveEvent.clientX - rec.left;
			} else if (isInverted) {
				pxFromStart = moveEvent.clientY - rec.top;
			} else {
				pxFromStart = rec.bottom - moveEvent.clientY;
			}

			const percent = clamp(pxFromStart / length, 0, 1);

			setValue(roundToStep(percent * (max - min) + min));
		};
		const moveTouch = (e: TouchEvent) => {
			e.preventDefault();
			move(e.changedTouches[0]);
		};

		const up = () => {
			window.removeEventListener("mousemove", move);
			window.removeEventListener("mouseup", up);
			window.removeEventListener("touchmove", moveTouch);
			window.removeEventListener("touchup", up);
		};

		window.addEventListener("mousemove", move);
		window.addEventListener("mouseup", up);
		window.addEventListener("touchmove", moveTouch, { passive: false });
		window.addEventListener("touchup", up);

		move(mouseDownEvent);
	}

	$effect(() =>
		applyBehaviors(handler, [
			listenerBehavior(
				"touchstart",
				(e) => {
					e.preventDefault();
					onMouseDown(e.changedTouches[0]);
				},
				{ passive: false }
			)
		])
	);
</script>

<div
	bind:this={handler}
	tabindex="0"
	class="relative h-full cursor-pointer rounded ring-blue-500 focus:outline-none focus-visible:ring-4 {isHorizontal
		? 'h-3 w-full'
		: 'h-full w-4'} progress-{type}"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={currentValue}
	aria-valuetext={ariaValueText}
	role="slider"
	aria-orientation="vertical"
	aria-label={ariaLabel}
	onkeydown={onKeyDownSlider}
	draggable="false"
	onmousedown={(e) => {
		e.preventDefault();
		onMouseDown(e);
	}}
	bind:clientWidth={width}
	bind:clientHeight={height}
	style:--picker-direction={isHorizontal
		? isInverted
			? "-90deg"
			: "90deg"
		: isInverted
			? "180deg"
			: "0deg"}
	style:--picker-color={color.toRgbMaxOpacity()}
	style:--picker-opacity={color.a}
	style:--picker-pure-hue={color.pureHue()}
	style:--picker-max-saturation={color.maxSaturation()}
	style:--picker-min-saturation={color.minSaturation()}
	style:--picker-max-brightness={color.maxBrightness()}
>
	<div
		class="absolute rounded border border-white shadow {isInverted || isHorizontal
			? '-translate-y-1/2'
			: 'translate-y-1/2'} {isInverted && isHorizontal
			? 'translate-x-1/2'
			: '-translate-x-1/2'} {isHorizontal ? 'top-1/2 h-5 w-2.5' : 'left-1/2 h-2.5 w-5'}"
		style="{isHorizontal
			? isInverted
				? 'right:'
				: 'left:'
			: isInverted
				? 'top:'
				: 'bottom:'} calc(100% * {color[type]});"
		aria-hidden="true"
	></div>
</div>

<style>
	.progress-h {
		background: linear-gradient(
			var(--picker-direction),
			#f00,
			#ff0 16.6%,
			#0f0 33.3%,
			#0ff 50%,
			#00f 67.7%,
			#f0f 83.3%,
			#f00
		);
	}
	.progress-s {
		background: linear-gradient(
			var(--picker-direction),
			var(--picker-min-saturation),
			var(--picker-max-saturation)
		);
	}
	.progress-v {
		background: linear-gradient(var(--picker-direction), #000, var(--picker-max-brightness));
	}
	.progress-a {
		background:
			linear-gradient(var(--picker-direction), theme("colors.gray.800"), rgba(0, 0, 0, 0)),
			linear-gradient(45deg, #ddd 25%, #0000 25%, #0000 75%, #ddd 75%) 0 0 / 12px 12px,
			linear-gradient(45deg, #ddd 25%, #0000 25%, #0000 75%, #ddd 75%) 6px 6px / 12px 12px,
			white;
	}
	.progress-h > div {
		background: var(--picker-pure-hue);
	}
	.progress-s > div {
		background: var(--picker-color);
	}
	.progress-v > div {
		background: var(--picker-color);
	}
	.progress-a > div {
		background-color: hsl(0 0 calc(50 * var(--picker-opacity) + 50));
	}
</style>
