import { dev } from "$app/environment";
import { uuid } from "$lib/uuid";
import { copyText, unreachable, type OptionalKeys } from "albtc";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

function clamp(num: number, min: number, max: number) {
	return Math.max(min, Math.min(max, num));
}

function applyScale(n: number, scale: ContentCommon["scale"]) {
	if (scale === "none") return 1;
	if (scale === "base") return n ** -0.5;
	unreachable(scale);
}

type Content = ContentCommon & ContentTypes;
type ContentCommon = {
	id: string;
	selectable: boolean;
	centerX: number;
	centerY: number;
	scale: "none" | "base";
	zIndex: number;
	groups: SvelteSet<string>;
};
type ContentTypes = ContentText | ContentImage;
type ContentText = {
	type: "text";
	content: string;
	color: string;
	font: "sans" | "mono" | "splatoon-text" | "splatoon-block";
};
type ContentImage = {
	type: "image";
	url: string;
};

type EditorEvent = {
	"context-menu-open": [{ x: number; y: number }];
	"context-menu-close": [];
};
type Conf = {
	readonly clientWidth: number;
	readonly clientHeight: number;
	readonly canvasEl: HTMLElement | undefined;
};
export class Editor {
	readonly conf: Conf;

	get clientWidth() {
		return this.conf.clientWidth;
	}
	get clientHeight() {
		return this.conf.clientHeight;
	}
	zoom = $state(1);
	offsetX = $state(0);
	offsetY = $state(0);
	mouseScreenX = $state(0);
	mouseScreenY = $state(0);
	get mouseX() {
		return this.toCanvasSpaceX(this.mouseScreenX);
	}
	get mouseY() {
		return this.toCanvasSpaceY(this.mouseScreenY);
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

	elements = $state<Record<string, Content>>({});

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
	toCanvasSpaceX(pxFromScreenLeft: number) {
		return this.offsetX + (pxFromScreenLeft - this.clientWidth / 2) / this.zoom;
	}
	/** Converts from a position in the browser to a position in the editor. */
	toCanvasSpaceY(pxFromScreenTop: number) {
		return this.offsetY + (pxFromScreenTop - this.clientHeight / 2) / this.zoom;
	}
	/** Converts from a position in the editor to a position in the browser. */
	toScreenSpaceX(canvasX: number) {
		return (canvasX - this.offsetX) * this.zoom + this.clientWidth / 2;
	}
	/** Converts from a position in the editor to a position in the browser. */
	toScreenSpaceY(canvasY: number) {
		return (canvasY - this.offsetY) * this.zoom + this.clientHeight / 2;
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
		if ((e.target as HTMLElement).nodeName === "textarea") return;

		if (e.code === "Space") {
			this.isSpaceDown = true;
			this.isPanning = this.isLeftMouseDown;
		} else if (e.code === "Delete") {
			this.selected.forEach((v) => this.deleteElement(v));
		} else {
			this.onKeyPress(e);
		}
	}
	/** Fired when a key is held down. */
	onKeyPress(e: KeyboardEvent) {
		if ((e.target as HTMLElement).nodeName === "textarea") return;

		if (e.code === "Equal" && e.ctrlKey) {
			this.zoomInTo(this.getNextZoomLevel(-1), this.offsetX, this.offsetY);
			e.preventDefault();
		} else if (e.code === "Minus" && e.ctrlKey) {
			this.zoomInTo(this.getNextZoomLevel(1), this.offsetX, this.offsetY);
			e.preventDefault();
		} else if (e.code === "Digit0" && e.ctrlKey) {
			this.zoomInTo(1, this.offsetX, this.offsetY);
			e.preventDefault();
		} else if (e.code === "KeyC" && e.ctrlKey && e.shiftKey) {
			copyText(
				JSON.stringify(
					[...this.selected].map((id) => {
						const el = this.getElement(id);
						if (el?.type === "text") {
							return {
								type: "callout",
								x: Math.round(el.centerX),
								y: Math.round(el.centerY),
								content: el.content
							};
						}
					})
				)
			);
			e.preventDefault();
		} else if (e.code === "KeyC" && e.ctrlKey) {
			copyText(JSON.stringify([...this.selected].map((id) => this.getElement(id))));
			e.preventDefault();
		} else if (e.code === "KeyV" && e.ctrlKey) {
			navigator.clipboard.readText().then((text) => {
				const arr = JSON.parse(text);
				for (const item of arr) {
					this.addElement(item);
				}
			});
		} else if (e.code === "KeyA" && e.ctrlKey) {
			// Select all elements
			for (const el of Object.values(this.elements)) {
				if (el.selectable) this.selectElement(el.id);
			}
			e.preventDefault();
		}
	}
	/** Fired when a key is released. */
	onKeyUp(e: KeyboardEvent) {
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
				const id = this.locateElementFromNode(e.target as HTMLElement);
				if (id === null) {
					if (!e.ctrlKey) {
						this.deselectAllElements();
					}
					return;
				}
				if (this.isElementSelected(id)) {
					if (!this.isOnlyElementSelected(id)) {
						this.mayBeDraggingSelectedElements = !e.ctrlKey;
					}
					return;
				}

				if (!e.ctrlKey) {
					this.deselectAllElements();
				}
				this.selectElement(id);
				this.mayBeDraggingSelectedElements = !e.ctrlKey;
			} else {
				this.mayBeDraggingSelectedElements = false;
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
			this.startPinchZoomLevel = this.zoom;
		}
	}
	/** Fired when the user moves their mouse. */
	onMouseMove(e: MouseEvent) {
		if (this.isPanning) {
			this.offsetX -= e.movementX / this.zoom;
			this.offsetY -= e.movementY / this.zoom;
		} else if (this.mayBeDraggingSelectedElements) {
			this.selected.forEach((id) => {
				const el = this.getElement(id);
				if (!el) return;

				this.updateElement(id, {
					centerX: el.centerX + e.movementX / this.zoom,
					centerY: el.centerY + e.movementY / this.zoom
				});
			});
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
			this.offsetX -= delta.x / this.zoom;
			this.offsetY -= delta.y / this.zoom;
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

			this.zoomInTo(newZoom, midX, midY);
		}
	}
	/** Fired when a mouse button is released. */
	onMouseUp(e: MouseEvent) {
		if (e.button === 0) {
			this.isLeftMouseDown = false;
			// Stop user from panning if no longer holding space or left mouse
			this.isPanning = false;
			this.mayBeDraggingSelectedElements = false;
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
		const zoomX = e.shiftKey ? this.offsetX : this.mouseX;
		const zoomY = e.shiftKey ? this.offsetY : this.mouseY;

		// Ctrl key activates fine zoom
		if (e.ctrlKey) {
			this.zoomInTo(
				Math.round(clamp(this.zoom - 0.01 * Math.sign(e.deltaY), 0.1, 10) * 100) / 100,
				zoomX,
				zoomY
			);
			e.preventDefault();
			return;
		}

		this.zoomInTo(this.getNextZoomLevel(Math.sign(e.deltaY) as 0 | -1 | 1), zoomX, zoomY);
	}
	getNextZoomLevel(dir: 1 | 0 | -1) {
		const PREDEFINED_ZOOMS = [
			0.1, 0.2, 0.33, 0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.4, 1.66, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10
		];
		let nextZoomIndex: number;
		if (dir === 1) {
			nextZoomIndex = PREDEFINED_ZOOMS.findLastIndex((v) => v < this.zoom);
		} else if (dir === -1) {
			nextZoomIndex = PREDEFINED_ZOOMS.findIndex((v) => v > this.zoom);
		} else {
			return this.zoom;
		}
		// No next smallest zoom found, meaning its at its limit already
		if (nextZoomIndex === -1) return this.zoom;

		return PREDEFINED_ZOOMS[clamp(nextZoomIndex, 0, PREDEFINED_ZOOMS.length - 1)];
	}
	/** Zooms in to a new zoom level, with the zoom center at the given
	 *  (x, y) coordinates.
	 */
	zoomInTo(newZoom: number, x: number, y: number) {
		const currentZoom = this.zoom;

		const currentWidth = this.clientWidth / currentZoom;
		const newWidth = this.clientWidth / newZoom;
		const percentageAcross = (x - this.offsetX) / currentWidth;
		this.offsetX = x - newWidth * percentageAcross;

		const currentHeight = this.clientHeight / currentZoom;
		const newHeight = this.clientHeight / newZoom;
		const percentageHeight = (y - this.offsetY) / currentHeight;
		this.offsetY = y - newHeight * percentageHeight;

		this.zoom = newZoom;
	}

	selected = new SvelteSet<string>();
	isElementSelected(id: string) {
		return this.selected.has(id);
	}
	isOnlyElementSelected(id: string) {
		return this.selected.has(id) && this.selected.size === 1;
	}
	selectElement(id: string) {
		this.selected.add(id);
	}
	deselectElement(id: string) {
		this.selected.delete(id);
	}
	deselectAllElements() {
		this.selected.clear();
	}

	queuedFocus = $state<string>();

	/** Generates a new ID. */
	genId(): string {
		return uuid();
	}
	/** Adds an element to the canvas.
	 *
	 *  Returns the ID of the newly-added element.
	 */
	addElement(
		el: OptionalKeys<ContentCommon, "id" | "selectable" | "scale" | "zIndex" | "groups"> &
			ContentTypes
	): string {
		const elementAdded: Content = {
			id: this.genId(),
			selectable: true,
			scale: "base",
			zIndex: Object.values(this.elements).reduce((p, c) => Math.max(p, c.zIndex), 0),
			groups: new SvelteSet(),
			...el
		};
		this.elements[elementAdded.id] = elementAdded;

		this.deselectAllElements();
		if (elementAdded.selectable) {
			this.selectElement(elementAdded.id);
		}
		this.queuedFocus = elementAdded.selectable ? elementAdded.id : undefined;

		return elementAdded.id;
	}

	/** Retrieves information about an element. */
	getElement<T extends Content["type"] | undefined = undefined>(
		id: string,
		type?: T
	): T extends undefined ? Content | undefined : Extract<Content, { type: T }> {
		const found = this.elements[id];
		// @ts-expect-error because of return type
		if (type === undefined) return found;
		if (found?.type !== type) throw new Error(`Expected ${id} to be ${type}, got ${found?.type}`);
		// @ts-expect-error because of return type
		return found;
	}
	getElementsInGroup(group: string): Array<Content> {
		return Object.values(this.elements).filter((el) => el.groups.has(group));
	}

	/** Updates an element by its ID */
	updateElement(id: string, data: Partial<Omit<ContentCommon, "id"> & ContentTypes>) {
		if (id in this.elements) {
			// @ts-expect-error because of "type" property. technically it
			// is unsafe but i dont feel like fixing it.
			this.elements[id] = {
				...this.elements[id],
				...data
			};
		}
	}

	/** Deletes an element by its ID */
	deleteElement(id: string) {
		delete this.elements[id];
		this.deselectElement(id);
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
		if (!element || !element.selectable) {
			return null;
		}

		return id;
	}

	calculateElementTransform(id: string) {
		return `translate(-50%, -50%) scale(${this.getScale(id)})`;
	}
	getScale(id: string) {
		const el = this.getElement(id);
		return applyScale(this.zoom, el?.scale ?? "base");
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
