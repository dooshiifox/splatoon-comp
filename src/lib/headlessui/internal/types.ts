type OptionalKeys<T, K extends keyof T> = Omit<T, K> & {
	[P in K]?: T[P] | undefined;
};

export type Callable = () => unknown;
export type Unsubscribe = () => void;
export type Cleanup = () => void;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Behavior = (node: HTMLElement) => Unsubscribe | void;

export type Item =
	| PropertyKey
	| {
			readonly key: PropertyKey;
			// readonly [key: string]: unknown;
	  };
export type ItemKey<T extends Item> = T extends PropertyKey
	? T
	: T extends { key: infer K extends PropertyKey }
		? K
		: never;

export type RequiredItemOptions<T extends Item> = {
	readonly value: T;
	/** The search filter when using the keyboard to filter.
	 *
	 *  Defaults to the node's `textContent`.
	 */
	readonly text: string;
	/** Whether or not the input is currently disabled.
	 *
	 *  @default false
	 */
	readonly disabled: boolean;
};
export type ItemOptions<T extends Item> = OptionalKeys<
	RequiredItemOptions<T>,
	"text" | "disabled"
>;

export type ListItem<T extends Item> = {
	id: string;
	node: HTMLElement;
} & RequiredItemOptions<T>;

export type List<T extends Item> = {
	/** All the items in the component's list. */
	items: Array<ListItem<T>>;
	/** The active item's index. This is *not* the selected item.
	 *  This is the hovered item or keyboard-navigated item.
	 *  `null` if no item is currently selected.
	 */
	active: number | null;
};

export type Searchable<T extends Item> = {
	/** The current search query. */
	query: string;
} & List<T>;

export type Labelable = {
	/** The string to set the `aria-label` attribute on a node to. */
	label: string;
};

export type Expandable = {
	/** Whether this item is currently expanded/opened. */
	expanded: boolean;
	/** Whether this item has ever been expanded/opened. */
	// flag if it's ever been opened, to prevent initial focus being set when closed
	opened: boolean;
};

export type Orientation = "horizontal" | "vertical";
export type Orientable = {
	/** The way this component is oriented. Affects keyboard navigation.
	 *
	 *  @default "horizontal"
	 */
	orientation: Orientation;
};

export type Checkable = {
	/** Whether this component is currently checked.
	 *
	 * @default false
	 */
	checked: boolean;
};

export type Controllable = {
	/** The node ID of the controls/contents of a component,
	 *  for example the button of a disclosure.
	 */
	controls?: string;
};

export type Pressable = {
	/** Whether this component is currently pressed.
	 *
	 * @default false
	 */
	pressed: boolean;
};

// TODO: enforce that it has to extend list (?)
export type Selectable<T extends Item> = {
	/** The currently-selected entries.
	 *
	 *  @default []
	 */
	selected: Array<T>;
	/** Whether multiple items can be selected.
	 *
	 *  @default false
	 */
	multi: boolean;
	/** A callback to be called whenever an item is selected.
	 *  Called with an array of all selected items.
	 */
	onselect: (value: Array<T>) => void;
};

// A different type of selectable where mutli-select is forbidden.
// Used on Tabs (who tf is selecting multiple tabs?)
export type SingleSelectable<T extends Item> = {
	/** The currently-selected item.
	 *
	 *  @default null
	 */
	selected: T | null;
	/** A callback to be called whenever an item is selected.
	 *  Called with an array of all selected items.
	 */
	onselect: (value: Array<T>) => void;
};
