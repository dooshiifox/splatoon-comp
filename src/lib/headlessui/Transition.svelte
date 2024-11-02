<script module lang="ts">
	// unique key for context
	const key = {};

	// interface for context
	type Context = {
		// appear setting
		readonly appear: boolean;

		// store provides observable state to child transitions
		readonly show: boolean | null;

		// number of child transitions that need to be waited before completed
		childrenCount: number;

		// method to communicate child transition completion
		childCompletedTransition: () => Promise<void>;
	};

	// convert a string of class names into an array, for use with DOM methods
	function classStrToArray(classes: string) {
		return classes.length > 0 ? classes.split(" ").filter((x) => x) : [];
	}

	// to wait until css changes have been appplied we use a double rAF
	function nextFrame() {
		const raf = requestAnimationFrame; // help minification
		return new Promise((resolve) => raf(() => raf(resolve)));
	}
</script>

<script lang="ts">
	import { getContext, setContext, tick, type Snippet } from "svelte";
	import { asyncnoop, noop } from "./internal/utils.svelte";

	let {
		// state of element (shown or hidden), if null this we are treated as a child
		// transition and will get the state from our parent, coordinating with it
		show = null,
		// apply transition when element is first rendered (i.e. animate in)
		appear = false,
		// whether the element should be removed from the DOM (vs hidden)
		unmount = false,
		// classes to apply when entering (showing)
		enter = "",
		enterFrom = "",
		enterTo = "",
		// classes to apply when leaving (hiding)
		leave = null,
		leaveFrom = null,
		leaveTo = null,
		onbeforeenter = undefined,
		onafterenter = undefined,
		onbeforeleave = undefined,
		onafterleave = undefined,
		children
	} = $props<{
		show?: boolean | null;
		appear?: boolean;
		unmount?: boolean;
		enter?: string;
		enterFrom?: string;
		enterTo?: string;
		leave?: string;
		leaveFrom?: string;
		leaveTo?: string;
		onbeforeenter?: () => void;
		onafterenter?: () => void;
		onbeforeleave?: () => void;
		onafterleave?: () => void;
		children: Snippet;
	}>();

	let enterClasses = $derived(classStrToArray(enter));
	let enterFromClasses = $derived(classStrToArray(enterFrom));
	let enterToClasses = $derived(classStrToArray(enterTo));

	// if leave, leaveFrom, or leaveTo are not specified then use enter values
	// as a convenient way to avoid repeating definitions (but reverse To & From)
	let leaveClasses = $derived(classStrToArray(leave ?? enter));
	let leaveFromClasses = $derived(classStrToArray(leaveFrom ?? enterTo));
	let leaveToClasses = $derived(classStrToArray(leaveTo ?? enterFrom));

	// get parent context if we're a child
	const parent = show === null ? getContext<Context>(key) : null;

	let innerShow = $state(show ?? parent?.show ?? null);
	$effect(() => {
		innerShow = show ?? parent?.show ?? null;
	});

	if (innerShow === null) {
		throw new Error(
			"Transition must be used as a child of a Transition with `show` set to `true` or `false`"
		);
	}
	let childrenCount = $state(0);

	const context: Context = {
		get appear() {
			return parent !== null ? parent.appear : appear;
		},
		get show() {
			return innerShow;
		},
		get childrenCount() {
			return childrenCount;
		},
		set childrenCount(val) {
			childrenCount = val;
		},
		childCompletedTransition: asyncnoop
	};

	// initial state
	let display = $state(innerShow === true && !context.appear ? "contents" : "none");
	let mounted = $state(!unmount || innerShow === true);

	// set context for children to use
	setContext(key, context);

	// use action that hooks into our wrapper div and manages everything
	function transition(node: HTMLElement, tShow: boolean | null) {
		// the child element that we will be applying classes to
		// let el: HTMLElement = node.firstElementChild as HTMLElement

		let el: HTMLElement;
		/** Add classes to the node */
		function addClasses(...classes: Array<string>) {
			el.classList.add(...classes);
		}

		function removeClasses(...classes: Array<string>) {
			el.classList.remove(...classes);
		}

		/** Resolves when all CSS transitions end. */
		function transitionEnd(transitions: Array<string>) {
			if (transitions.length === 0) {
				return Promise.resolve();
			}

			return new Promise<void>((resolve) =>
				el.addEventListener(
					"transitionend",
					(e) => {
						e.stopPropagation();
						resolve();
					},
					{ once: true }
				)
			);
		}

		/** Wait for the children animations to complete
		 *  (i.e., `Transition`'s as children of this `Transition`)
		 */
		function childrenCompleted(parentCompleted: Promise<void>) {
			if (context.childrenCount === 0) {
				return Promise.resolve();
			}

			return new Promise<void>((resolve) => {
				let count = 0;
				context.childCompletedTransition = () => {
					if (++count === context.childrenCount) {
						resolve();
					}
					return parentCompleted;
				};
			});
		}

		/** Transition in or out using a set of CSS classes. */
		async function apply(
			shouldShow: boolean,
			base: Array<string>,
			from: Array<string>,
			to: Array<string>
		) {
			el = await ensureMountedElement();

			let resolveCompleted = noop;
			const completed = new Promise<void>((resolve) => {
				resolveCompleted = resolve;
			});

			const awaitChildrenCompleted = childrenCompleted(completed);

			// set state for any child transitions
			innerShow = shouldShow;

			addClasses(...base, ...from);

			const transitioned = transitionEnd(base);

			await nextFrame();

			removeClasses(...from);
			addClasses(...to);

			await Promise.all([transitioned, awaitChildrenCompleted]);

			if (parent !== null) {
				await parent.childCompletedTransition();
			}

			removeClasses(...base, ...to);

			resolveCompleted();
		}

		async function ensureMountedElement() {
			if (unmount && !mounted) {
				mounted = true;
				await tick(); // give slot chance to render
			}
			return node.firstElementChild as HTMLElement;
		}

		async function transitionIn() {
			onbeforeenter?.();

			display = "contents";

			await apply(true, enterClasses, enterFromClasses, enterToClasses);

			onafterenter?.();
		}

		async function transitionOut() {
			onbeforeleave?.();

			await apply(false, leaveClasses, leaveFromClasses, leaveToClasses);

			display = "none";

			if (unmount) {
				mounted = false;
			}

			onafterleave?.();
		}

		// execute is always called, even for the initial render, so we use a flag
		// to prevent a transition running unless appear is set for animating in
		let run = context.appear;

		// to wait for in-progress transitions to complete
		let executing: Promise<void>;

		function execute(executeShow: boolean | null) {
			// run appropriate transition, set promise for completion
			executing = run ? (executeShow ? transitionIn() : transitionOut()) : Promise.resolve();

			// play transitions on all subsequent calls ...
			run = true;
		}

		// to unsubscribe from parent when we're destroyed (if we're a child)
		let unsubscribe = noop;

		// if we're a child transition, increment the count on the parent and listen for state notifications
		if (parent !== null) {
			parent.childrenCount++;
			// child updates happen here, as show propery is updated by the parent, which triggers the transition
			unsubscribe = $effect.root(() => {
				$effect(() => execute(parent.show));
			});
		} else {
			// otherwise, first run through to set initial state (and possibly, 'appear' transition)
			execute(tShow);
		}

		return {
			update(updateShow: boolean | null) {
				// top-level updates happen here, as show property is updated, which triggers the transition
				// wait for current transition to complete so state is consistent (may be state waiting on our events)
				void executing.then(() => execute(updateShow));
			},
			destroy() {
				// if we're a child and being removed, notify our parent and stop listening for updates
				if (parent !== null) {
					unsubscribe();
					parent.childrenCount--;
				}
			}
		};
	}
</script>

<div style:display use:transition={innerShow}>
	{#if mounted}
		{@render children()}
	{/if}
</div>
