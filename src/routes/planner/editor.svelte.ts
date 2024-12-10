import { dev } from "$app/environment";
import { clamp } from "$lib";
import { Color } from "$lib/color.svelte";
import { tweenedState } from "$lib/tween.svelte";
import { uuid } from "$lib/uuid";
import { copyText, unreachable, type OptionalKeys } from "albtc";
import { linear, quadOut } from "svelte/easing";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import * as v from "valibot";

const PROTOCOL = 1;

// Colors from the server are always returned in #rrggbbaa format.
const vColor = v.pipe(
	v.string(),
	v.hexColor(),
	v.transform((c) => Color.fromRgb(c)!)
);
const vPercentage = v.pipe(v.number(), v.minValue(0), v.maxValue(1));

const vCanvas = v.pipe(v.number(), v.minValue(0), v.maxValue(65535));
const vUuid = v.pipe(v.string(), v.uuid());
const vAccessLevel = v.picklist(["view", "edit", "admin"]);
type AccessLevel = v.InferOutput<typeof vAccessLevel>;
const vUser = v.object({
	color: vColor,
	username: v.string(),
	canvas: vCanvas,
	uuid: vUuid,
	access_level: vAccessLevel
});
type User = v.InferOutput<typeof vUser>;

const vElementAnchor = v.object({
	top: vPercentage,
	left: vPercentage
});

const vTextAlignment = v.picklist(["left", "center", "right", "justify"]);
const vTextFont = v.object({
	font_type: v.picklist(["sans", "serif", "mono"]),
	custom_font_family: v.optional(v.nullable(v.string()), null)
});
const vElementText = v.object({
	type: v.literal("text"),
	content: v.string(),
	align: vTextAlignment,
	color: vColor,
	size: v.pipe(v.number(), v.minValue(0)),
	font: vTextFont,
	background_color: vColor,
	background_blur: v.pipe(v.number(), v.minValue(0))
});

const vImageCrop = v.object({
	left: vPercentage,
	top: vPercentage,
	right: vPercentage,
	bottom: vPercentage
});
const vImageText = v.object({
	x: vPercentage,
	y: vPercentage,
	anchor: vElementAnchor,
	text: vElementText
});

const vElementImage = v.object({
	type: v.literal("image"),
	url: v.string(),
	alt: v.string(),
	scale_x: v.number(),
	scale_y: v.number(),
	crop: vImageCrop,
	outline_color: vColor,
	outline_thickness: v.pipe(v.number(), v.minValue(0)),
	outline_blur: v.pipe(v.number(), v.minValue(0)),
	text: v.array(vImageText)
});

const vElementType = v.variant("type", [vElementText, vElementImage]);

const vScaleRate = v.picklist(["none", "base"]);
type ScaleRate = v.InferOutput<typeof vScaleRate>;
const vElement = v.object({
	uuid: vUuid,
	ty: vElementType,
	last_edited_by: v.nullable(vUuid),
	selected_by: v.nullable(vUuid),
	x: v.number(),
	y: v.number(),
	anchor: vElementAnchor,
	rotation: v.number(),
	scale_rate: vScaleRate,
	z_index: v.number(),
	tags: v.pipe(
		v.array(v.string()),
		v.transform((i) => new SvelteSet(i))
	)
});
export type Element = v.InferOutput<typeof vElement>;
export type PartialElement = OptionalKeys<
	Element,
	| "uuid"
	| "scale_rate"
	| "z_index"
	| "rotation"
	| "tags"
	| "anchor"
	| "selected_by"
	| "last_edited_by"
>;

const vMsgJoin = v.object({
	type: v.literal("join"),
	user: vUser
});
const vMsgOnJoin = v.object({
	type: v.literal("on_join"),
	user: vUser,
	users: v.array(vUser),
	elements: v.array(vElement)
});
const vMsgDisconnect = v.object({
	type: v.literal("disconnect"),
	user: vUuid
});
const vMsgUserChange = v.object({
	type: v.literal("user_change"),
	user: vUser
});
const vMsgSelection = v.object({
	type: v.literal("selection"),
	user_uuid: vUuid,
	newly_selected: v.array(vUuid),
	newly_deselected: v.array(vUuid)
});
const vMsgSelectionResponse = v.object({
	type: v.literal("selection_response"),
	user_uuid: vUuid,
	newly_selected: v.array(vUuid),
	newly_deselected: v.array(vUuid),
	failed_to_select: v.array(vUuid)
});
const vMsgCanvasResponse = v.object({
	type: v.literal("canvas_response"),
	canvas: v.number(),
	elements: v.array(vElement)
});
const vMsgElementsChanged = v.object({
	type: v.literal("elements_changed"),
	elements: v.array(vElement),
	deleted_elements: v.array(vUuid)
});
const vMsg = v.variant("type", [
	vMsgJoin,
	vMsgOnJoin,
	vMsgDisconnect,
	vMsgUserChange,
	vMsgSelection,
	vMsgSelectionResponse,
	vMsgCanvasResponse,
	vMsgElementsChanged
]);

type Command = { id?: string } & (
	| SelectCommand
	| AccessLevelAdjustmentCommand
	| CanvasCommand
	| ChangedElementsCommand
);
type SelectCommand = {
	type: "selection";
	elements: Array<string>;
};
type AccessLevelAdjustmentCommand = {
	type: "access_level_adjustment";
	user: string;
	access_level: AccessLevel;
};
type CanvasCommand = {
	type: "canvas";
	canvas: number;
};
type ChangedElementsCommand = {
	type: "changed_elements";
	elements: Array<Element>;
	deleted_elements: Array<string>;
};
const commandResponse = {
	selection(_) {
		return {
			data: vMsgSelectionResponse,
			error: v.object({
				code: v.picklist(["no_permission", "room_does_not_exist"])
			})
		};
	},
	access_level_adjustment(_) {
		return {
			data: vMsgUserChange,
			error: v.object({
				code: v.picklist(["no_permission", "room_does_not_exist", "user_does_not_exist"])
			})
		};
	},
	canvas(_) {
		return {
			data: vMsgCanvasResponse,
			error: v.object({
				code: v.picklist(["room_does_not_exist"])
			})
		};
	},
	changed_elements(_) {
		return {
			data: vMsgElementsChanged,
			error: v.object({
				code: v.picklist(["no_permission", "room_does_not_exist"])
			})
		};
	}
} as const satisfies {
	[K in Command["type"]]: (sent: Extract<Command, { type: K }>) => {
		data: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
		error: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
	};
};
type CommandResponse<K extends keyof typeof commandResponse> = {
	[K in keyof typeof commandResponse]:
		| {
				data: v.InferOutput<ReturnType<(typeof commandResponse)[K]>["data"]>;
				error: never;
		  }
		| {
				data: never;
				error: v.InferOutput<ReturnType<(typeof commandResponse)[K]>["error"]>;
		  };
}[K];

function applyScale(n: number, scale: ScaleRate) {
	if (scale === "none") return 1;
	if (scale === "base") return n ** -0.5;
	unreachable(scale);
}

function canAcceptKeyboardEvents(e: KeyboardEvent) {
	return (
		(e.target as HTMLElement).nodeName.toLowerCase() !== "textarea" &&
		(e.target as HTMLElement).nodeName.toLowerCase() !== "input"
	);
}

type UpdateableState<T> = {
	update(data: T): void;
	finish(): void;
};
type UpdateableElement = Partial<Element> & { uuid: string };

type EditorEvent = {
	"context-menu-open": [{ x: number; y: number }];
	"context-menu-close": [];
};
type Conf = {
	readonly clientWidth: number;
	readonly clientHeight: number;
	readonly canvasEl: HTMLElement | undefined;
};
export const LOCKED_TAG = "locked";
export const NO_SYNC_TAG = "no-sync";
export class Editor {
	readonly conf: Conf;

	get clientWidth() {
		return this.conf.clientWidth;
	}
	get clientHeight() {
		return this.conf.clientHeight;
	}
	readonly zoom = tweenedState(1, {
		duration: 100,
		easing: quadOut
	});
	readonly offsetX = tweenedState(0, {
		duration: 0,
		easing: linear
	});
	readonly offsetY = tweenedState(0, {
		duration: 0,
		easing: linear
	});
	setPosition(x: number, y: number, animated = false) {
		this.offsetX.setValue(x, animated ? { duration: 100 } : {});
		this.offsetY.setValue(y, animated ? { duration: 100 } : {});
	}
	mouseScreenX = $state(0);
	mouseScreenY = $state(0);
	get mouseX() {
		return this.toCanvasSpaceX(this.mouseScreenX);
	}
	get mouseY() {
		return this.toCanvasSpaceY(this.mouseScreenY);
	}
	get mouseXTarget() {
		return this.toCanvasSpaceX(this.mouseScreenX, false);
	}
	get mouseYTarget() {
		return this.toCanvasSpaceY(this.mouseScreenY, false);
	}

	isSpaceDown = $state(false);
	isLeftMouseDown = $state(false);
	isPanning = $state(false);
	mayBeDraggingSelectedElements = $state(false);
	get cursor() {
		if (this.isPanning) return "cursor-grabbing";
		if (this.isSpaceDown) return "cursor-grab";
		if (this.mayBeDraggingSelectedElements) return "cursor-move";
		return "cursor-auto";
	}

	elements = $state<Record<string, Element>>({});
	history = new ElementHistory(this);
	room = new RoomCollab(this);

	movementHistoryEntry: UpdateableState<Array<UpdateableElement>> | undefined;

	constructor(conf: Conf) {
		this.conf = conf;
	}

	eventHandlers: {
		[K in keyof EditorEvent]?: Set<(...args: EditorEvent[K]) => unknown>;
	} = {};
	/** Listen to an event that can be dispatched by the editor.
	 *  Returns a function to unsubscribe from the event.
	 */
	subscribe<T extends keyof EditorEvent>(event: T, handler: (...args: EditorEvent[T]) => unknown) {
		if (!(event in this.eventHandlers)) {
			// @ts-expect-error its fine
			this.eventHandlers[event] = new Set();
		}
		this.eventHandlers[event]?.add(handler);

		return () => this.eventHandlers[event]?.delete(handler);
	}
	/** Dispatches an event to all listeners. */
	dispatch<T extends keyof EditorEvent>(event: T, ...data: EditorEvent[T]) {
		this.eventHandlers[event]?.forEach((handler) => handler(...data));
	}

	/** Converts from a position in the browser to a position in the editor. */
	toCanvasSpaceX(pxFromScreenLeft: number, useAnimated = true) {
		if (useAnimated) {
			return this.offsetX.animated + (pxFromScreenLeft - this.clientWidth / 2) / this.zoom.animated;
		}
		return this.offsetX.target + (pxFromScreenLeft - this.clientWidth / 2) / this.zoom.target;
	}
	/** Converts from a position in the browser to a position in the editor. */
	toCanvasSpaceY(pxFromScreenTop: number, useAnimated = true) {
		if (useAnimated) {
			return this.offsetY.animated + (pxFromScreenTop - this.clientHeight / 2) / this.zoom.animated;
		}
		return this.offsetY.target + (pxFromScreenTop - this.clientHeight / 2) / this.zoom.target;
	}
	/** Converts from a position in the editor to a position in the browser. */
	toScreenSpaceX(canvasX: number, useAnimated = true) {
		if (useAnimated) {
			return (canvasX - this.offsetX.animated) * this.zoom.animated + this.clientWidth / 2;
		}
		return (canvasX - this.offsetX.target) * this.zoom.target + this.clientWidth / 2;
	}
	/** Converts from a position in the editor to a position in the browser. */
	toScreenSpaceY(canvasY: number, useAnimated = true) {
		if (useAnimated) {
			return (canvasY - this.offsetY.animated) * this.zoom.animated + this.clientHeight / 2;
		}
		return (canvasY - this.offsetY.target) * this.zoom.target + this.clientHeight / 2;
	}

	/** Opens the context menu at the current mouse position. */
	openContextMenu() {
		this.dispatch("context-menu-open", {
			x: this.mouseScreenX,
			y: this.mouseScreenY
		});
	}
	/** Closes the open context menu. */
	closeContextMenu() {
		this.dispatch("context-menu-close");
	}

	/** Fired when a key is pressed down. */
	onKeyDown(e: KeyboardEvent) {
		if (!canAcceptKeyboardEvents(e)) return;

		if (e.code === "Space") {
			this.isSpaceDown = true;
			this.isPanning = this.isLeftMouseDown;
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if (e.code === "Delete") {
			this.selected.forEach((v) => this.deleteElement(v));
			e.preventDefault();
			e.stopImmediatePropagation();
		} else {
			this.onKeyPress(e);
		}
	}
	/** Fired when a key is held down. */
	onKeyPress(e: KeyboardEvent) {
		if (!canAcceptKeyboardEvents(e)) return;

		if (e.code === "Equal" && e.ctrlKey) {
			this.zoomInTo(this.getNextZoomLevel(-1), this.offsetX.target, this.offsetY.target);
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if (e.code === "Minus" && e.ctrlKey) {
			this.zoomInTo(this.getNextZoomLevel(1), this.offsetX.target, this.offsetY.target);
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if (e.code === "Digit0" && e.ctrlKey) {
			this.zoomInTo(1, this.offsetX.target, this.offsetY.target);
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if (e.code === "KeyC" && e.ctrlKey && e.shiftKey) {
			copyText(
				JSON.stringify(
					[...this.selected].map((id) => {
						const el = this.getElement(id);
						if (el?.ty.type === "text") {
							return {
								type: "callout",
								x: Math.round(el.x),
								y: Math.round(el.y),
								content: el.ty.content
							};
						}
					})
				)
			);
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if (e.code === "KeyC" && e.ctrlKey) {
			copyText(JSON.stringify([...this.selected].map((id) => this.getElement(id))));
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if (e.code === "KeyV" && e.ctrlKey) {
			navigator.clipboard.readText().then((text) => {
				const arr = JSON.parse(text);
				this.addElements(arr);
			});
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if (e.code === "KeyA" && e.ctrlKey) {
			// Select all elements
			for (const el of Object.values(this.elements)) {
				if (this.isElementSelectable(el)) this.selectElement(el.uuid);
			}
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if ((e.code === "KeyY" && e.ctrlKey) || (e.code === "KeyZ" && e.ctrlKey && e.shiftKey)) {
			console.trace("Reapply");
			this.history.reapply();
			e.preventDefault();
			e.stopImmediatePropagation();
		} else if (e.code === "KeyZ" && e.ctrlKey) {
			this.history.revert();
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	}
	/** Fired when a key is released. */
	onKeyUp(e: KeyboardEvent) {
		if (!canAcceptKeyboardEvents(e)) return;

		if (e.code === "Space") {
			this.isSpaceDown = false;
			// Press space but left mouse is still down, allow user to still pan
			this.isPanning = this.isLeftMouseDown;
		}
	}

	touchPoints = new TouchPoints();
	/** Fired when a mouse button is pressed down. */
	onMouseDown(e: MouseEvent) {
		if (e.button === 0) {
			this.isLeftMouseDown = true;
			this.isPanning = this.isSpaceDown;

			if (!this.isPanning) {
				const target = e.target as HTMLElement;
				const id = this.locateElementFromNode(target);
				if (id === null) {
					if (!e.ctrlKey) {
						this.deselectAllElements();
					}
					return;
				}
				const el = this.getElement(id);
				if (!el) return;

				if (el.ty.type === "text" && !target.dataset["move"] && this.isElementSelected(id)) {
					if (!this.isOnlyElementSelected(id)) {
						this.mayBeDraggingSelectedElements = !e.ctrlKey;
					}
					if (this.mayBeDraggingSelectedElements) {
						this.movementHistoryEntry = this.startUpdatingElements();
					} else {
						this.movementHistoryEntry?.finish();
						this.movementHistoryEntry = undefined;
					}
					return;
				}

				if (!e.ctrlKey && !target.dataset["move"]) {
					this.deselectAllElements();
				}
				this.selectElement(id);
				this.mayBeDraggingSelectedElements = !e.ctrlKey;
				if (this.mayBeDraggingSelectedElements) {
					this.movementHistoryEntry = this.startUpdatingElements();
				} else {
					this.movementHistoryEntry?.finish();
					this.movementHistoryEntry = undefined;
				}
			} else {
				this.mayBeDraggingSelectedElements = false;
				this.movementHistoryEntry?.finish();
				this.movementHistoryEntry = undefined;
			}
		} else if (e.button === 1) {
			this.isPanning = true;
		}
	}
	/** Fired when a touch button is pressed down. */
	onTouchDown(e: TouchEvent) {
		if (window.lockTouch === true) {
			this.touchPoints.keptTouches.push(e.touches.item(0)?.identifier ?? 0);
		}
		this.touchPoints.updatePoints(e.touches);
		this.isPanning = this.touchPoints.length === 1;
		if (this.touchPoints.length === 2) {
			this.startPinchZoomLevel = this.zoom.animated;
		}
	}
	/** Fired when the user moves their mouse. */
	onMouseMove(e: MouseEvent) {
		if (this.isPanning) {
			this.setPosition(
				this.offsetX.animated - e.movementX / this.zoom.animated,
				this.offsetY.animated - e.movementY / this.zoom.animated
			);
		} else if (this.mayBeDraggingSelectedElements) {
			this.movementHistoryEntry?.update([
				...this.selected
					.values()
					.map((id) => {
						const el = this.getElement(id);
						if (!el) return;

						return {
							uuid: id,
							x: el.x + e.movementX / this.zoom.animated,
							y: el.y + e.movementY / this.zoom.animated
						};
					})
					.filter((v) => v !== undefined)
			]);
		}

		this.mouseScreenX = e.clientX;
		this.mouseScreenY = e.clientY;
	}
	startPinchZoomLevel = 1;
	/** Fired when the user drags the screen. */
	onTouchMove(e: TouchEvent) {
		this.touchPoints.updatePoints(e.touches);
		if (this.isPanning) {
			const delta = this.touchPoints.getPoints()[0]?.delta ?? {
				x: 0,
				y: 0,
				force: 0,
				rotationAngle: 0
			};
			this.setPosition(
				this.offsetX.animated - delta.x / this.zoom.animated,
				this.offsetY.animated - delta.y / this.zoom.animated
			);
		} else if (this.touchPoints.length === 2) {
			// User is probably trying to zoom in
			const [pointA, pointB] = this.touchPoints.getPoints();
			// Get the mid point
			const midX = this.toCanvasSpaceX((pointA.current.x + pointB.current.x) / 2);
			const midY = this.toCanvasSpaceY((pointA.current.y + pointB.current.y) / 2);
			// How much did we zoom in by?
			const currentDistance = Math.hypot(
				pointA.current.x - pointB.current.x,
				pointA.current.y - pointB.current.y
			);
			const startDistance = Math.hypot(
				pointA.start.x - pointB.start.x,
				pointA.start.y - pointB.start.y
			);
			const zoomPercentage = (currentDistance - startDistance) / startDistance;
			const newZoom = (1 + zoomPercentage) * this.startPinchZoomLevel;

			this.zoomInTo(newZoom, midX, midY, false);
		}
	}
	/** Fired when a mouse button is released. */
	onMouseUp(e: MouseEvent) {
		if (e.button === 0) {
			this.isLeftMouseDown = false;
			// Stop user from panning if no longer holding space or left mouse
			this.isPanning = false;
			this.mayBeDraggingSelectedElements = false;
			this.movementHistoryEntry?.finish();
			this.movementHistoryEntry = undefined;
		} else if (e.button === 1) {
			this.isPanning = false;
		}
	}
	/** Fired when a touch button is released. */
	onTouchUp(e: TouchEvent) {
		this.touchPoints.updatePoints(e.touches);
		this.isPanning = this.touchPoints.length === 1;
	}
	/** Fired when the user uses right-click. */
	onContextMenu(e: MouseEvent) {
		this.openContextMenu();
		e.preventDefault();
	}

	/** Fired when the user scrolls their scroll wheel. */
	onWheel(e: WheelEvent) {
		if (!e.target || !this.conf.canvasEl?.contains(e.target as Node)) {
			return;
		}

		const zoomX = e.shiftKey ? this.offsetX.target : this.mouseXTarget;
		const zoomY = e.shiftKey ? this.offsetY.target : this.mouseYTarget;

		// Ctrl key activates fine zoom
		if (e.ctrlKey) {
			this.zoomInTo(
				Math.round(clamp(this.zoom.target - 0.01 * Math.sign(e.deltaY), 0.1, 10) * 100) / 100,
				zoomX,
				zoomY,
				true,
				false
			);
			e.preventDefault();
			return;
		}

		this.zoomInTo(
			this.getNextZoomLevel(Math.sign(e.deltaY) as 0 | -1 | 1),
			zoomX,
			zoomY,
			true,
			false
		);
	}
	getNextZoomLevel(dir: 1 | 0 | -1): number {
		const PREDEFINED_ZOOMS = [
			0.1, 0.2, 0.33, 0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.4, 1.66, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10
		];
		let nextZoomIndex: number;
		const currentZoom = this.zoom.target;
		if (dir === 1) {
			nextZoomIndex = PREDEFINED_ZOOMS.findLastIndex((v) => v < currentZoom);
		} else if (dir === -1) {
			nextZoomIndex = PREDEFINED_ZOOMS.findIndex((v) => v > currentZoom);
		} else {
			return currentZoom;
		}
		// No next smallest zoom found, meaning its at its limit already
		if (nextZoomIndex === -1) return currentZoom;

		return PREDEFINED_ZOOMS[clamp(nextZoomIndex, 0, PREDEFINED_ZOOMS.length - 1)];
	}
	/** Zooms in to a new zoom level, with the zoom center at the given
	 *  (x, y) coordinates.
	 */
	zoomInTo(newZoom: number, x: number, y: number, animated = true, animatedPos = true) {
		const currentZoom = animatedPos ? this.zoom.animated : this.zoom.target;

		const currentWidth = this.clientWidth / currentZoom;
		const newWidth = this.clientWidth / newZoom;
		const offsetX = animatedPos ? this.offsetX.animated : this.offsetX.target;
		const percentageAcross = (x - offsetX) / currentWidth;

		const currentHeight = this.clientHeight / currentZoom;
		const newHeight = this.clientHeight / newZoom;
		const offsetY = animatedPos ? this.offsetY.animated : this.offsetY.target;
		const percentageHeight = (y - offsetY) / currentHeight;

		const interpX = () => () => {
			const newWidth = this.clientWidth / this.zoom.animated;
			return x - newWidth * percentageAcross;
		};
		const interpY = () => () => {
			const newHeight = this.clientHeight / this.zoom.animated;
			return y - newHeight * percentageHeight;
		};

		this.zoom.setValue(newZoom, animated ? {} : { duration: 0 });
		this.offsetX.setValue(
			x - newWidth * percentageAcross,
			animated ? { duration: 100, interpolate: interpX } : {}
		);
		this.offsetY.setValue(
			y - newHeight * percentageHeight,
			animated ? { duration: 100, interpolate: interpY } : {}
		);
	}

	// Note about element selection:
	// `selected` should be taken as the source of truth for what the user
	// has selected, not `selected_by`.
	// `selected_by` is what the server says is selected,
	readonly selected = new SvelteSet<string>();
	isElementSelected(id: string) {
		return this.selected.has(id);
	}
	/** Get the user this element is selected by. */
	getSelectedBy(id: string): User | undefined {
		const selectedBy = this.getElement(id)?.selected_by;
		return !selectedBy ? undefined : this.room.getUser(selectedBy);
	}
	isOnlyElementSelected(id: string) {
		return this.selected.has(id) && this.selected.size === 1;
	}
	selectElement(id: string) {
		if (
			!this.elements[id] ||
			this.selected.has(id) ||
			(this.room.accessLevel === "view" && !this.getElement(id)?.tags.has(NO_SYNC_TAG))
		)
			return;
		this.history.apply(new UpdateSelectionHistoryEntry({ newlySelected: [id] }));
	}
	deselectElement(id: string) {
		if (!this.selected.has(id)) return;
		this.history.apply(new UpdateSelectionHistoryEntry({ newlyDeselected: [id] }));
	}
	deselectAllElements() {
		if (this.selected.size === 0) return;
		this.history.apply(new UpdateSelectionHistoryEntry({ newlyDeselected: [...this.selected] }));
	}
	isEditable(ids: Array<string>, allowEditingLocked = false): boolean {
		// For each ID, check if it is selected by someone other than this user
		for (const id of ids) {
			const el = this.getElement(id);
			if (!el) continue;
			// Make sure this is the only user who has it selected
			if (el.selected_by !== null && el.selected_by !== this.room.userUuid) {
				return false;
			}
			// Make sure its not locked
			if (el.tags.has(LOCKED_TAG) && !allowEditingLocked) {
				return false;
			}
			// Make sure if the user isn't allowed to edit on the server then
			// the element is entirely local
			if (this.room.accessLevel === "view" && !el.tags.has(NO_SYNC_TAG)) {
				return false;
			}
		}
		return true;
	}

	queuedFocus = $state<string>();

	/** Adds elements to the canvas.
	 *
	 *  Returns the ID of the newly-added elements.
	 */
	addElements(elements: Array<PartialElement>, createHistoryEntry = true): Array<string> {
		const entry = new AddElementsHistoryEntry(elements);
		if (createHistoryEntry) {
			this.history.apply(entry);
		} else {
			entry.apply(this);
		}
		return entry.getUuids()!;
	}

	/** Retrieves information about an element. */
	getElement<T extends Element["ty"]["type"] | undefined = undefined>(
		id: string,
		type?: T
	): T extends undefined
		? Element | undefined
		: { ty: Extract<Element["ty"], { type: T }> } & Omit<Element, "ty"> {
		const found = this.elements[id];
		// @ts-expect-error because of return type
		if (type === undefined) return found;
		if (found?.ty.type !== type) {
			throw new Error(`Expected ${id} to be ${type}, got ${found?.ty.type}`);
		}
		// @ts-expect-error because of return type
		return found;
	}
	getElementsInGroup(group: string): Array<Element> {
		return Object.values(this.elements).filter((el) => el.tags.has(group));
	}

	/** Updates an element by its ID */
	updateElements(data: Array<UpdateableElement>, createHistoryEntry = true) {
		const historyEntry = new UpdateElementsHistoryEntry(data);
		if (createHistoryEntry) {
			this.history.apply(historyEntry);
		} else {
			historyEntry.apply(this);
		}
	}
	/** Updates elements without committing them to history, until the
	 *  `finish` function is called.
	 */
	startUpdatingElements(): UpdateableState<Array<UpdateableElement>> {
		const history = new ProgressiveUpdateElementsHistoryEntry();
		let applied = false;

		const update = (data: Array<UpdateableElement>) => {
			if (applied) {
				throw new Error("Trying to update elements when state is already committed to history.");
			}
			history.update(this, data);
		};

		const finish = () => {
			if (!applied && Object.entries(history.elementsAfterUpdate).length > 0) {
				applied = true;
				this.history.apply(history);
			}
		};

		return {
			update,
			finish
		};
	}

	/** Deletes an element by its ID */
	deleteElement(id: string, createHistoryEntry = true) {
		this.deselectElement(id);
		const historyEntry = new DeleteElementsHistoryEntry([id]);
		if (createHistoryEntry) {
			this.history.apply(historyEntry);
		} else {
			historyEntry.apply(this);
		}
	}

	/** Checks if an element is allowed to be selected. */
	isElementSelectable(element: string | Element) {
		const el = typeof element === "string" ? this.getElement(element) : element;
		return (
			el &&
			!el.tags.has(LOCKED_TAG) &&
			(!el.selected_by || el.selected_by === this.room.userUuid) &&
			(this.room.accessLevel !== "view" || el.tags.has(NO_SYNC_TAG))
		);
	}

	locateElementFromNode(node: HTMLElement): string | null {
		while (node.dataset["id"] === undefined) {
			if (node.parentElement === null) {
				return null;
			}

			node = node.parentElement;
		}

		const id = node.dataset["id"];
		const element = this.getElement(id);
		if (!element || !this.isElementSelectable(element)) {
			return null;
		}

		return id;
	}

	calculateElementTransform(id: string) {
		return `translate(-50%, -50%) scale(${this.getScale(id)})`;
	}
	getScale(id: string) {
		const el = this.getElement(id);
		return applyScale(this.zoom.animated, el?.scale_rate ?? "base");
	}
}

export const RENDER_TOUCH_POINTS = false;
const TOUCH_POINTS_MAP = RENDER_TOUCH_POINTS && dev ? SvelteMap : Map;

type TouchPoint = {
	/** Same as the key. */
	identifier: number;
	start: {
		x: number;
		y: number;
		force: number;
		rotationAngle: number;
	};
	current: {
		x: number;
		y: number;
		force: number;
		rotationAngle: number;
	};
	/** The amount of change since the last time `updatePoints` was called. */
	delta: {
		x: number;
		y: number;
		force: number;
		rotationAngle: number;
	};
};
class TouchPoints {
	points = new TOUCH_POINTS_MAP<number, TouchPoint>();

	/** For debugging purposes, allows you to specify points which do not disappear. */
	keptTouches: Array<number> = [];

	/** Updates the list of current touches. */
	updatePoints(touches: TouchList) {
		// Remove any that arent in the list
		// "*gasp* it's O(n^2)" how many points are there going to be where it matters
		pointLoop: for (const [identifier] of this.points) {
			if (this.keptTouches.includes(identifier)) {
				continue pointLoop;
			}

			// touchlist doesnt support stuff like `Array.any`
			for (const touch of touches) {
				if (touch.identifier === identifier) {
					continue pointLoop;
				}
			}

			// Not in the new touch list, remove it
			this.points.delete(identifier);
		}

		// Add or update everything in the touch list
		for (const touch of touches) {
			const current = {
				x: touch.clientX,
				y: touch.clientY,
				force: touch.force,
				rotationAngle: touch.rotationAngle
			};

			const previous = this.points.get(touch.identifier);
			if (previous) {
				// Update
				this.points.set(touch.identifier, {
					...previous,
					current,
					delta: {
						x: current.x - previous.current.x,
						y: current.y - previous.current.y,
						force: current.force - previous.current.force,
						rotationAngle: current.rotationAngle - previous.current.rotationAngle
					}
				});
			} else {
				// New touch
				this.points.set(touch.identifier, {
					identifier: touch.identifier,
					start: current,
					current,
					delta: {
						x: 0,
						y: 0,
						force: 0,
						rotationAngle: 0
					}
				});
			}
		}
	}

	/** Returns the current points. */
	getPoints(): Array<TouchPoint> {
		return Array.from(this.points.values());
	}

	/** `for (const point of <TouchPoints instance>)` implementation. */
	*[Symbol.iterator](): Iterable<TouchPoint> {
		for (const point of this.points.values()) {
			yield point;
		}
	}

	/** The number of currently-registered points. */
	get length(): number {
		return this.points.size;
	}
}

type CallbackCollection<T> = Array<(arg: T) => unknown>;
const DEFAULT_UUID = "SELF";
const DEFAULT_USER: User = {
	access_level: "admin",
	canvas: 0,
	color: Color.fromRgb("#3b82f6")!,
	username: "You",
	uuid: DEFAULT_UUID
};
export class RoomCollab {
	connectionState = $state<"connecting" | "open" | "closing" | "closed">("closed");

	private conn: WebSocket | undefined;

	private awaitOpenCallbacks: CallbackCollection<Event> = [];
	private awaitCloseCallbacks: CallbackCollection<CloseEvent> = [];
	private awaitErrorCallbacks: CallbackCollection<Event | undefined> = [];
	private awaitMessageCallbacks: CallbackCollection<MessageEvent | undefined> = [];
	private awaitIdCallbacks: Map<string, CallbackCollection<unknown>> = new Map();

	userUuid = $state<string>(DEFAULT_UUID);
	get user() {
		const u = this.users.find((u) => u.uuid === this.userUuid);
		if (!u) throw new Error("Cannot find user.");
		return u;
	}
	get accessLevel() {
		return this.user.access_level;
	}
	get canvas() {
		return this.user.canvas;
	}
	#isSwitchingCanvas = $state<false | number>(false);
	get isSwitchingCanvas() {
		return this.#isSwitchingCanvas !== false;
	}

	async setCanvas(canvas: number) {
		if (this.isConnectionOpen()) {
			this.#isSwitchingCanvas = canvas;
			await this.send({
				type: "canvas",
				canvas
			});
		} else {
			this.users = this.users.map((u) => {
				if (u.uuid === this.userUuid) {
					return { ...u, canvas };
				}
				return u;
			});
		}
	}
	users = $state<Array<User>>([DEFAULT_USER]);
	getUser(userId: string) {
		return this.users.find(({ uuid }) => userId === uuid);
	}

	constructor(private editor: Editor) {}

	async connect(
		url: string,
		room: string,
		username: string,
		color?: string | undefined,
		password?: string | undefined,
		canvas?: number | undefined
	) {
		if (this.isConnectionOpen()) {
			await this.disconnect();
		}

		const p: Record<string, string> = {
			protocol: PROTOCOL.toString(),
			room,
			username
		};
		if (color) {
			p.color = color;
		}
		if (password) {
			p.password = password;
		}
		if (canvas !== undefined) {
			p.canvas = canvas.toString();
		}

		try {
			this.conn = new WebSocket(`${url}?${new URLSearchParams(p).toString()}`);
		} catch (e) {
			console.error("Failed to connect to server", e);
			throw new Error("Failed to connect to server.");
		}

		this.connectionState = "connecting";
		this.conn.addEventListener("open", (e) => {
			// Call all open event listeners
			this.connectionState = "open";
			this.awaitOpenCallbacks.forEach((cb) => cb(e));
			this.awaitOpenCallbacks = [];
		});
		this.conn.addEventListener("close", (e) => {
			this.onDisconnect(e);
		});
		this.conn.addEventListener("error", (e) => {
			// Call all error event listeners
			this.awaitErrorCallbacks.forEach((cb) => cb(e));
			this.awaitErrorCallbacks = [];
		});
		this.conn.addEventListener("message", (e) => {
			// Call all message event listeners
			// Try parse as JSON.
			let data: unknown = undefined;
			try {
				data = JSON.parse(e.data);
			} catch {
				// Couldn't parse, oh well.
				console.warn("Got message from server we couldn't decode:", e);
			}
			if (data !== undefined) {
				this.onMessage(data, e);
			}
			if (typeof data === "object" && data && "id" in data && typeof data.id === "string") {
				const callbacks = this.awaitIdCallbacks.get(data.id) ?? [];
				callbacks.forEach((res) => res(data));
				this.awaitIdCallbacks.delete(data.id);
			}
			this.awaitMessageCallbacks.forEach((cb) => cb(e));
			this.awaitMessageCallbacks = [];
		});

		// Wait for either an error, a close, or a first message
		const event = await Promise.any([this.awaitError(), this.awaitClose(), this.awaitMessage()]);
		if (event === undefined) {
			// `awaitError` and `awaitMessage` can return undefined, only if
			// the socket is closed, but if the socket is closed then
			// `awaitClose` will return first and return an event.
			// If we get undefined, our reasoning has gone wrong somewhere.
			throw new Error("Something went horribly wrong?");
		}

		// If it was an error we received, tell the user
		if (event.type === "error") {
			console.error("Failed to connect to server: Error", event);
			throw new Error("Failed to connect to server.");
		} else if (event.type === "close") {
			this.handleJoinError(event as CloseEvent);
		} else if (event.type === "message") {
			// Yippee! it worked!
			// Handling the 'on_join' response is done by the `onMessage` handler.
		}
	}

	handleJoinError(event: CloseEvent): never {
		// Try parse what type of error it was and give feedback to
		// the user.
		console.log("An issue occured connecting to server: Close", event);
		let reason;
		try {
			reason = JSON.parse((event as CloseEvent).reason);
		} catch {
			console.warn("^^^ JSON parsing error.");
			throw new Error("Failed to connect to server.");
		}

		const validate = v.variant("type", [
			v.object({
				type: v.picklist([
					"room_missing",
					"username_missing",
					"color_invalid",
					"password_required",
					"password_incorrect"
				])
			}),
			v.object({
				type: v.literal("protocol_error"),
				server: v.pipe(v.number(), v.minValue(0))
			}),
			v.object({
				type: v.literal("room_invalid_length"),
				min_len: v.pipe(v.number(), v.minValue(0)),
				max_len: v.pipe(v.number(), v.minValue(0)),
				specified_len: v.pipe(v.number(), v.minValue(0))
			}),
			v.object({
				type: v.literal("username_invalid_length"),
				min_len: v.pipe(v.number(), v.minValue(0)),
				max_len: v.pipe(v.number(), v.minValue(0)),
				specified_len: v.pipe(v.number(), v.minValue(0))
			})
		]);
		const close = v.safeParse(validate, reason);
		if (!close.success) {
			console.warn("^^^ Validation error.");
			throw new Error("Failed to connect to server.");
		}
		const r = close.output;

		if (r.type === "protocol_error") {
			// check our protocol vs the server's
			if (r.server > PROTOCOL) {
				throw new Error(
					"The server is using a newer communication protocol. Try refresh the webpage."
				);
			} else {
				throw new Error(
					"The server is using an outdated communication protocol. Try again shortly, or bug the server admin to update it."
				);
			}
		} else if (r.type === "room_missing") {
			throw new Error("Please specify the name of the room to create or join!");
		} else if (r.type === "room_invalid_length") {
			if (r.min_len > r.specified_len) {
				throw new Error(
					`That room name is too short! Yours is ${r.specified_len} characters, but the minimum is ${r.min_len} characters.`
				);
			} else {
				throw new Error(
					`That room name is too long! Yours is ${r.specified_len} characters, but the maximum is ${r.max_len} characters.`
				);
			}
		} else if (r.type === "username_missing") {
			throw new Error("Please enter a username to join with!");
		} else if (r.type === "username_invalid_length") {
			if (r.min_len > r.specified_len) {
				throw new Error(
					`That username is too short! Yours is ${r.specified_len} characters, but the minimum is ${r.min_len} characters.`
				);
			} else {
				throw new Error(
					`That username is too long! Yours is ${r.specified_len} characters, but the maximum is ${r.max_len} characters.`
				);
			}
		} else if (r.type === "color_invalid") {
			throw new Error("That color doesn't seem valid. Please choose another!");
		} else if (r.type === "password_required") {
			throw new Error("A password is required to join this room.");
		} else if (r.type === "password_incorrect") {
			throw new Error("Sorry, that password isn't correct! Please try again.");
		} else {
			unreachable(r.type);
		}
	}

	isConnectionConnecting(): boolean {
		return this.conn !== undefined && this.conn.readyState === this.conn.CONNECTING;
	}
	isConnectionOpen(): boolean {
		return this.conn !== undefined && this.conn.readyState === this.conn.OPEN;
	}
	isConnectionClosed(): boolean {
		return this.conn === undefined || this.conn.readyState === this.conn.CLOSED;
	}

	/** Disconnects from the current client.
	 *
	 *  Resolves after disconnect.
	 */
	async disconnect() {
		// Already disconnected
		if (this.isConnectionClosed()) return;

		const onClose = this.awaitClose();
		// Need to close the connection if not already closing
		// Regardless, we need to await the promise.
		if (this.conn !== undefined && this.conn.readyState !== this.conn.CLOSING) {
			this.conn!.close();
			this.connectionState = "closing";
		}

		await onClose;
		// close event listener handles setting all the state
	}

	onDisconnect(e: CloseEvent) {
		this.connectionState = "closed";
		this.conn = undefined;
		this.users = this.users.filter((u) => u.uuid === this.userUuid);

		for (const id in this.editor.elements) {
			if (this.editor.elements[id].selected_by !== this.userUuid) {
				this.editor.elements[id].selected_by = null;
			}
			this.editor.elements[id].last_edited_by = null;
		}

		// Call all close event listeners
		this.awaitCloseCallbacks.forEach((cb) => cb(e));
		this.awaitCloseCallbacks = [];
		this.awaitErrorCallbacks.forEach((cb) => cb(undefined));
		this.awaitErrorCallbacks = [];
		this.awaitMessageCallbacks.forEach((cb) => cb(undefined));
		this.awaitMessageCallbacks = [];
		this.awaitIdCallbacks.forEach((callbacks) => callbacks.forEach((res) => res(undefined)));
		this.awaitIdCallbacks = new Map();
	}

	onMessage(json: unknown, _e: MessageEvent) {
		const resp = v.safeParse(
			v.object({
				id: v.nullable(vUuid),
				data: vMsg
			}),
			json
		);
		if (!resp.success) {
			console.warn("Couldn't parse server message as a valid response:", json, resp.issues);
			return;
		}

		const msg = resp.output.data;
		console.log(msg);
		if (msg.type === "on_join") {
			this.onJoin(msg);
		} else if (msg.type === "join") {
			this.userJoined(msg.user);
		} else if (msg.type === "disconnect") {
			this.userDisconnected(msg.user);
		} else if (msg.type === "user_change") {
			this.userChanged(msg.user);
		} else if (msg.type === "selection" || msg.type === "selection_response") {
			this.onUsersSelection(msg);
		} else if (msg.type === "canvas_response") {
			this.onCanvasResponse(msg);
		} else if (msg.type === "elements_changed") {
			this.onElementsChanged(msg);
		} else {
			unreachable(msg);
		}
	}
	onJoin(msg: v.InferOutput<typeof vMsgOnJoin>) {
		const prevUuid = this.userUuid;
		this.userUuid = msg.user.uuid;
		this.users = msg.users;
		for (const [id, el] of Object.entries(this.editor.elements)) {
			// Delete all elements not marked as NO_SYNC
			if (!el.tags.has(NO_SYNC_TAG)) {
				delete this.editor.elements[id];
			}
			// For the remaining elements, update all instances of the old UUID
			// to the new UUID
			if (this.editor.elements[id].last_edited_by === prevUuid) {
				this.editor.elements[id].last_edited_by = msg.user.uuid;
			} else {
				this.editor.elements[id].last_edited_by = null;
			}

			if (this.editor.elements[id].selected_by === prevUuid) {
				this.editor.elements[id].selected_by = msg.user.uuid;
			} else {
				this.editor.elements[id].selected_by = null;
			}
		}
		for (const el of msg.elements) {
			this.editor.elements[el.uuid] = el;
		}
	}
	userJoined(user: User) {
		this.users.push(user);
	}
	userChanged(user: User) {
		this.users = this.users.map((u) => (u.uuid === user.uuid ? user : u));
		if (user.access_level === "view") {
			// Deselect all their elements
			// If its the client, clear 'selected' too
			for (const el in this.editor.elements) {
				if (this.editor.elements[el].selected_by === user.uuid) {
					this.editor.elements[el].selected_by = null;
				}
			}
			if (this.userUuid === user.uuid) {
				this.editor.selected.clear();
			}
		}
	}
	userDisconnected(userUuid: string) {
		this.users = this.users.filter((u) => u.uuid !== userUuid);
		// Deselect all their elements
		for (const el in this.editor.elements) {
			if (this.editor.elements[el].selected_by === userUuid) {
				this.editor.elements[el].selected_by = null;
			}
		}
	}
	onUsersSelection(
		msg: v.InferOutput<typeof vMsgSelection> | v.InferOutput<typeof vMsgSelectionResponse>
	) {
		for (const selectedElId of msg.newly_selected) {
			if (this.editor.elements[selectedElId] === undefined) continue;
			this.editor.elements[selectedElId].selected_by = msg.user_uuid;
			if (this.editor.selected.has(selectedElId) && msg.user_uuid !== this.userUuid) {
				this.editor.selected.delete(selectedElId);
			}
		}
		for (const deselectedElId of msg.newly_deselected) {
			if (this.editor.elements[deselectedElId] === undefined) continue;
			if (this.editor.elements[deselectedElId].selected_by === msg.user_uuid) {
				this.editor.elements[deselectedElId].selected_by = null;
			}
		}

		if (msg.type === "selection_response") {
			// Deselect all that failed to be selected
			for (const id of msg.failed_to_select) {
				this.editor.selected.delete(id);
			}
		}
	}
	onCanvasResponse(msg: v.InferOutput<typeof vMsgCanvasResponse>) {
		// User switched canvas a second time before the data from this one
		// was loaded.
		if (this.#isSwitchingCanvas !== msg.canvas) {
			return;
		}

		this.users = this.users.map((u) => {
			if (u.uuid === this.userUuid) {
				return { ...u, canvas: msg.canvas };
			}
			return u;
		});
		for (const [id, el] of Object.entries(this.editor.elements)) {
			// Delete all elements not marked as NO_SYNC
			if (!el.tags.has(NO_SYNC_TAG)) {
				delete this.editor.elements[id];
			}
		}
		// Add all new elements
		for (const el of msg.elements) {
			this.editor.elements[el.uuid] = el;
		}
		this.#isSwitchingCanvas = false;
	}
	onElementsChanged(msg: v.InferOutput<typeof vMsgElementsChanged>) {
		for (const deleted of msg.deleted_elements) {
			delete this.editor.elements[deleted];
		}
		for (const changed of msg.elements) {
			this.editor.elements[changed.uuid] = changed;
		}
	}

	/** Sends a command to the server.
	 *
	 *  If `id` is provided, the function will wait for a response from the
	 *  server with the same id, validate, and return it. If the client
	 *  disconnects before a response is received, it will return `undefined`.
	 *
	 *  If the client is not yet connected to the server, this will return `undefined`.
	 */
	async send<const C extends Command>(
		json: C
	): Promise<C["id"] extends string ? CommandResponse<C["type"]> | undefined : void> {
		if (!this.isConnectionOpen() || !this.conn) return;

		this.conn.send(
			JSON.stringify(json, (_, v) => {
				if (v instanceof Set) return [...v.values()];
				if (v instanceof Color) return v.rgb;
				return v;
			})
		);

		if (json.id) {
			const resp = await this.awaitId(json.id);
			// Disconnected
			if (resp === undefined) return;

			// @ts-expect-error TS can't infer correct types here?
			const expectedTypes = commandResponse[json.type](json);
			const dataType = v.union([
				v.object({
					id: vUuid,
					data: expectedTypes.data,
					error: v.optional(v.never())
				}),
				v.object({
					id: vUuid,
					data: v.optional(v.never()),
					error: expectedTypes.error
				})
			]);

			// Validate
			const validated = v.safeParse(dataType, resp);
			if (!validated.success) return;
			// @ts-expect-error TS can't infer correct types here
			return validated.output as CommandResponse<C["type"]>;
		}
	}
	async onSelectedElementsChange(elementIds: Array<string>) {
		if (!this.isConnectionOpen()) return;

		const selection = await this.send({
			id: uuid(),
			type: "selection",
			elements: elementIds
		});
		if (!selection || selection.error) {
			this.editor.selected.clear();
		}
	}
	changeAccessLevel(userId: string, to: AccessLevel) {
		return this.send({
			id: uuid(),
			type: "access_level_adjustment",
			user: userId,
			access_level: to
		});
	}

	/** Awaits for the connection to become open from the connecting state.
	 *
	 *  If the connection is already open, closing, or closed, this will
	 *  resolve instantly.
	 */
	awaitOpen() {
		if (!this.isConnectionConnecting()) return;

		return new Promise<Event>((res) => {
			this.awaitOpenCallbacks.push(res);
		});
	}
	/** Awaits for the connection to close.
	 *
	 *  If the connection is already closed, this will resolve instantly.
	 */
	awaitClose() {
		if (this.isConnectionClosed()) return;

		return new Promise<CloseEvent>((res) => {
			this.awaitCloseCallbacks.push(res);
		});
	}
	/** Awaits for the connection to experience an error.
	 *
	 *  If the connection is closed, this will resolve instantly. If the
	 *  connection closes without an error occurring, this will resolve
	 *  with `undefined`.
	 */
	awaitError() {
		if (this.isConnectionClosed()) return;

		return new Promise<Event | undefined>((res) => {
			this.awaitErrorCallbacks.push(res);
		});
	}
	/** Awaits for the connection to receive a message.
	 *
	 *  If the connection is closed, this will resolve instantly. If the
	 *  connection closes without another message, this will resolve
	 *  with `undefined`.
	 */
	awaitMessage() {
		if (this.isConnectionClosed()) return;

		return new Promise<MessageEvent | undefined>((res) => {
			this.awaitMessageCallbacks.push(res);
		});
	}
	/** Awaits for the connection to receive a message with a given `id`.
	 *
	 *  If the connection is closed, this will resolve instantly. If the
	 *  connection closes before a response is received, this will resolve
	 *  with `undefined`.
	 */
	awaitId(id: string) {
		if (this.isConnectionClosed()) return;

		return new Promise<unknown>((res) => {
			const existingCallbacks = this.awaitIdCallbacks.get(id);
			this.awaitIdCallbacks.set(id, [...(existingCallbacks ?? []), res]);
		});
	}
}

class ElementHistory {
	historyEntries: Array<HistoryEntry> = [];
	index: number = -1;

	constructor(private editor: Editor) {}

	apply(entry: HistoryEntry) {
		this.historyEntries.splice(this.index + 1);
		this.historyEntries.push(entry);

		const preChangeSelectedElements = new Set(this.editor.selected);
		const result = entry.apply(this.editor);
		if (result !== "fail") {
			this.syncState({
				preChangeSelectedElements,
				...result
			});
			return entry;
		}

		this.index = this.historyEntries.length - 1;
	}
	revert(): HistoryEntry | undefined {
		// Keep reverting until something doesn't fail
		const preChangeSelectedElements = new Set(this.editor.selected);
		while (this.index > -1) {
			const entry = this.historyEntries.at(this.index);
			if (entry === undefined) {
				throw new Error(`No entry: ${this.index}/${this.historyEntries.length}`);
			}
			this.index--;

			const result = entry.revert(this.editor);
			if (result !== "fail") {
				this.syncState({
					preChangeSelectedElements,
					...result
				});
				return entry;
			}
		}

		// Nothing left to revert
		this.syncState({
			preChangeSelectedElements
		});
		return undefined;
	}
	reapply(): boolean {
		// Keep reapplying until something doesn't fail.
		const preChangeSelectedElements = new Set(this.editor.selected);
		while (this.index < this.historyEntries.length) {
			const entry = this.historyEntries.at(this.index);
			if (entry === undefined) {
				throw new Error(`No entry: ${this.index}/${this.historyEntries.length}`);
			}
			this.index++;
			console.log("Reapplying ", entry.constructor.name);

			const result = entry.apply(this.editor);
			if (result !== "fail") {
				this.syncState({
					preChangeSelectedElements,
					...result
				});
				return true;
			}
		}

		// Nothing left to reapply
		this.syncState({
			preChangeSelectedElements
		});
		return false;
	}

	syncState(changes: HistoryStateChanges) {
		// Check if theres any differences in the selected elements
		if (
			changes.preChangeSelectedElements &&
			changes.preChangeSelectedElements.symmetricDifference(this.editor.selected).size > 0
		) {
			this.editor.room.onSelectedElementsChange([...this.editor.selected]);
		}

		// Announce changes to elements
		if (changes.createdOrModifiedElements || changes.deletedElements) {
			this.editor.room.send({
				type: "changed_elements",
				elements: changes.createdOrModifiedElements ?? [],
				deleted_elements: changes.deletedElements ?? []
			});
		}
	}
}

type HistoryActions = {
	createdOrModifiedElements?: Array<Element>;
	deletedElements?: Array<string>;
};
type HistoryStateChanges = HistoryActions & {
	preChangeSelectedElements?: Set<string>;
};

abstract class HistoryEntry {
	entry: string;
	constructor() {
		this.entry = uuid();
	}

	abstract apply(editor: Editor): HistoryActions | "fail";
	abstract revert(editor: Editor): HistoryActions | "fail";
}

class UpdateSelectionHistoryEntry extends HistoryEntry {
	constructor(
		private selections: {
			newlySelected?: Array<string>;
			newlyDeselected?: Array<string>;
		}
	) {
		super();
	}

	apply(editor: Editor): HistoryActions | "fail" {
		if (editor.room.accessLevel === "view") return "fail";

		let nothingHappened = true;
		this.selections.newlySelected?.forEach((id) => {
			if (!editor.elements[id] || editor.selected.has(id)) return;
			editor.selected.add(id);
			nothingHappened = false;
		});
		this.selections.newlyDeselected?.forEach((id) => {
			if (!editor.selected.has(id)) return;
			editor.selected.delete(id);
			if (editor.elements[id]) {
				nothingHappened = false;
			}
		});
		if (nothingHappened) return "fail";

		return {};
	}
	revert(editor: Editor): HistoryActions | "fail" {
		if (editor.room.accessLevel === "view") return "fail";

		let nothingHappened = true;
		this.selections.newlySelected?.forEach((id) => {
			if (!editor.selected.has(id)) return;
			editor.selected.delete(id);
			if (editor.elements[id]) {
				nothingHappened = false;
			}
		});
		this.selections.newlyDeselected?.forEach((id) => {
			if (!editor.elements[id] || editor.selected.has(id)) return;
			editor.selected.add(id);
			nothingHappened = false;
		});
		if (nothingHappened) return "fail";

		return {};
	}
}

class AddElementsHistoryEntry extends HistoryEntry {
	private elements: Array<Element> | undefined;
	/** Elements that got deselected when applying the entry. */
	private deselectedElements: Iterable<string> = [];
	private isRedoing = false;

	constructor(private rawElements: Array<PartialElement>) {
		super();
	}

	getUuids() {
		return this.elements?.map(({ uuid }) => uuid);
	}

	apply(editor: Editor) {
		if (this.elements === undefined) {
			this.elements = this.rawElements.map((el): Element => {
				return {
					uuid: uuid(),
					scale_rate: "base",
					z_index: Object.values(editor.elements).reduce((p, c) => Math.max(p, c.z_index), 0),
					tags: new SvelteSet(),
					anchor: {
						top: 0.5,
						left: 0.5
					},
					rotation: 0,
					last_edited_by: editor.room.userUuid,
					selected_by: null,
					...el
				};
			});
		} else {
			this.elements = this.elements.map((el): Element => {
				// Element with this ID already exists
				if (editor.getElement(el.uuid)) {
					throw new Error("Element with uuid already exists");
				}

				return {
					...el,
					last_edited_by: editor.room.userUuid,
					selected_by: null
				};
			});
		}

		let nothingHappened = true;
		// Select the new elements.
		this.deselectedElements = editor.selected;
		editor.selected.clear();
		for (const element of this.elements) {
			if (editor.room.accessLevel !== "view" || element.tags.has(NO_SYNC_TAG)) {
				editor.elements[element.uuid] = element;
				if (editor.isElementSelectable(element) && !editor.selected.has(element.uuid)) {
					editor.selected.add(element.uuid);
				}
				nothingHappened = false;
			}
		}
		if (nothingHappened) {
			for (const v of this.deselectedElements) {
				editor.selected.add(v);
			}
			return "fail";
		}

		if (
			this.elements.length === 1 &&
			editor.isElementSelectable(this.elements[0]) &&
			!this.isRedoing
		) {
			editor.queuedFocus = this.elements[0].uuid;
		} else {
			editor.queuedFocus = undefined;
		}

		return {
			createdOrModifiedElements: this.elements.filter((el) => !el.tags.has(NO_SYNC_TAG))
		};
	}

	revert(editor: Editor) {
		this.isRedoing = true;
		if (this.elements === undefined) return "fail";

		// Delete all the elements if this user was the last to edit them.
		let nothingHappened = true;

		editor.selected.clear();
		for (const reselectingUuid of this.deselectedElements) {
			if (editor.isElementSelectable(reselectingUuid) && !editor.selected.has(reselectingUuid)) {
				editor.selected.add(reselectingUuid);
				nothingHappened = false;
			}
		}

		const gotDeleted = [];
		for (const element of this.elements) {
			const el = editor.getElement(element.uuid);
			if (
				!el ||
				el.last_edited_by !== editor.room.userUuid ||
				(editor.room.accessLevel === "view" && !element.tags.has(NO_SYNC_TAG))
			) {
				continue;
			}

			delete editor.elements[element.uuid];
			if (!el.tags.has(NO_SYNC_TAG)) {
				gotDeleted.push(element.uuid);
			}
			nothingHappened = false;
		}
		this.deselectedElements = [];

		if (nothingHappened) return "fail";

		return {
			deletedElements: gotDeleted
		};
	}
}

class UpdateElementsHistoryEntry extends HistoryEntry {
	beforeUpdates: Array<Element> | undefined;

	constructor(private updates: Array<UpdateableElement>) {
		super();
	}

	apply(editor: Editor) {
		this.beforeUpdates = [];
		const elements = this.updates
			.map((el): Element | undefined => {
				const current = editor.getElement(el.uuid);
				if (current === undefined) {
					return undefined;
				}
				if (!editor.isEditable([el.uuid], true)) {
					return undefined;
				}

				this.beforeUpdates!.push(current);
				return {
					...current,
					...el,
					last_edited_by: editor.room.userUuid
				};
			})
			.filter((x) => x !== undefined);

		if (elements.length === 0) {
			return "fail";
		}

		let nothingHappened = true;
		for (const element of elements) {
			if (editor.room.accessLevel !== "view" || element.tags.has(NO_SYNC_TAG)) {
				editor.elements[element.uuid] = element;
				nothingHappened = false;
			}
		}
		if (nothingHappened) return "fail";

		return {
			createdOrModifiedElements: elements.filter((el) => !el.tags.has(NO_SYNC_TAG))
		};
	}

	revert(editor: Editor) {
		if (this.beforeUpdates === undefined) return "fail";

		// Revert all the elements if this user was the last to edit them.
		let nothingHappened = true;

		const updated = [];
		for (const element of this.beforeUpdates) {
			const el = editor.getElement(element.uuid);
			if (
				!el ||
				el.last_edited_by !== editor.room.userUuid ||
				(editor.room.accessLevel === "view" && !element.tags.has(NO_SYNC_TAG))
			) {
				continue;
			}

			editor.elements[element.uuid] = element;
			if (!el.tags.has(NO_SYNC_TAG)) {
				updated.push(element);
			}
			nothingHappened = false;
		}
		this.beforeUpdates = undefined;

		if (nothingHappened) return "fail";

		return {
			createdOrModifiedElements: updated
		};
	}
}

class ProgressiveUpdateElementsHistoryEntry extends HistoryEntry {
	elementsBeforeUpdate: Record<string, Element> = {};
	elementsAfterUpdate: Record<string, Element> = {};

	constructor() {
		super();
	}

	update(editor: Editor, updates: Array<UpdateableElement>) {
		const elements = updates
			.map((el): Element | undefined => {
				const current = editor.getElement(el.uuid);
				if (current === undefined) {
					return undefined;
				}
				if (!editor.isEditable([el.uuid], true)) {
					return undefined;
				}

				if (!(el.uuid in this.elementsBeforeUpdate)) {
					this.elementsBeforeUpdate[el.uuid] = current;
				}

				return {
					...current,
					...el,
					last_edited_by: editor.room.userUuid
				};
			})
			.filter((x) => x !== undefined);

		for (const element of elements) {
			if (editor.room.accessLevel !== "view" || element.tags.has(NO_SYNC_TAG)) {
				editor.elements[element.uuid] = element;
				this.elementsAfterUpdate[element.uuid] = element;
			}
		}
	}

	apply(editor: Editor) {
		const elements = Object.values(this.elementsAfterUpdate)
			.map((el): Element | undefined => {
				const current = editor.getElement(el.uuid);
				if (current === undefined) {
					return undefined;
				}
				if (!editor.isEditable([el.uuid], true)) {
					return undefined;
				}

				return {
					...current,
					...el,
					last_edited_by: editor.room.userUuid
				};
			})
			.filter((x) => x !== undefined);

		if (elements.length === 0) {
			return "fail";
		}

		let nothingHappened = true;
		for (const element of elements) {
			if (editor.room.accessLevel !== "view" || element.tags.has(NO_SYNC_TAG)) {
				editor.elements[element.uuid] = element;
				nothingHappened = false;
			}
		}
		if (nothingHappened) return "fail";

		return {
			createdOrModifiedElements: elements.filter((el) => !el.tags.has(NO_SYNC_TAG))
		};
	}

	revert(editor: Editor) {
		// Revert all the elements if this user was the last to edit them.
		let nothingHappened = true;

		const updated = [];
		for (const element of Object.values(this.elementsBeforeUpdate)) {
			const el = editor.getElement(element.uuid);
			if (
				!el ||
				el.last_edited_by !== editor.room.userUuid ||
				(editor.room.accessLevel === "view" && !element.tags.has(NO_SYNC_TAG))
			) {
				continue;
			}

			editor.elements[element.uuid] = element;
			if (!el.tags.has(NO_SYNC_TAG)) {
				updated.push(element);
			}
			nothingHappened = false;
		}

		if (nothingHappened) return "fail";

		return {
			createdOrModifiedElements: updated
		};
	}
}

class DeleteElementsHistoryEntry extends HistoryEntry {
	private elements: Array<Element> | undefined;

	constructor(private uuids: Array<string>) {
		super();
	}

	apply(editor: Editor) {
		let nothingHappened = true;
		this.elements = [];
		for (const id of this.uuids) {
			const el = editor.getElement(id);
			if (el && (editor.room.accessLevel !== "view" || el.tags.has(NO_SYNC_TAG))) {
				this.elements.push(el);
				delete editor.elements[id];
				nothingHappened = false;
			}
		}
		if (nothingHappened) {
			return "fail";
		}

		return {
			deletedElements: this.elements
				.filter((el) => !el.tags.has(NO_SYNC_TAG))
				.map(({ uuid }) => uuid)
		};
	}

	revert(editor: Editor) {
		if (this.elements === undefined) return "fail";

		// Delete all the elements if this user was the last to edit them.
		let nothingHappened = true;

		const reAdded = [];
		for (const element of this.elements) {
			if (editor.room.accessLevel === "view" && !element.tags.has(NO_SYNC_TAG)) {
				continue;
			}

			editor.elements[element.uuid] = {
				...element,
				selected_by: null,
				last_edited_by: editor.room.userUuid
			};
			if (!element.tags.has(NO_SYNC_TAG)) {
				reAdded.push(element);
			}
			nothingHappened = false;
		}
		this.elements = [];

		if (nothingHappened) return "fail";

		return {
			createdOrModifiedElements: reAdded
		};
	}
}
