/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('mdast').List} List
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('hast').Root} HastRoot
 */

/**
 * @typedef SearchEntry
 * @property {string} id
 * @property {Array<PhrasingContent>} children
 * @property {Rank} depth
 * @property {boolean} beforeStart
 */

/**
 * @typedef TableEntry
 * @property {string} slug
 * @property {string} name
 * @property {Rank} depth
 * @property {boolean} beforeContentsHeader
 * @property {Array<TableEntry>} children
 */

import Slugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import { convert } from "unist-util-is";
import { visit } from "unist-util-visit";

const slugs = new Slugger();

/** @param {Root} root */
function remarkTocTree(root) {
	const parents = convert(function (d) {
		return d === root;
	});

	/** @type {Array<SearchEntry>} */
	const map = [];
	/** @type {number | undefined} */
	let openingIndex;
	/** @type {number | undefined} */
	let endIndex;
	/** @type {Heading | undefined} */
	let opening;
	/** @type {boolean} */
	let isNumbered = false;

	slugs.reset();

	// Visit all headings in `root`.  We `slug` all headings (to account for
	// duplicates), but only create a TOC from top-level headings (by default).
	visit(root, "heading", function (node, position, parent) {
		const value = toString(node, { includeImageAlt: false });
		/** @type {string} */
		// @ts-expect-error `hProperties` from <https://github.com/syntax-tree/mdast-util-to-hast>
		const id = node.data && node.data.hProperties && node.data.hProperties.id;
		const slug = slugs.slug(id || value);

		if (!parents(parent)) {
			return;
		}

		node.data = {
			...node.data,
			hProperties: {
				...node.data?.hProperties,
				id: slug
			}
		};

		// Our opening heading.
		if (position !== undefined && !openingIndex && /^(contents|contents numbered)$/i.test(value)) {
			isNumbered = /numbered/i.test(value);
			openingIndex = position + 1;
			opening = node;
			return;
		}

		// Our closing heading.
		if (position !== undefined && opening && !endIndex && node.depth <= opening.depth) {
			endIndex = position;
		}

		// A heading after the closing (if we were looking for one).
		map.push({
			beforeStart: !endIndex,
			depth: Math.max(node.depth, 2),
			children: node.children,
			id: slug
		});
	});

	if (!openingIndex) {
		return;
	}

	/** @type {Array<TableEntry>} */
	const tableFull = [];
	// Normalise the depths
	let minDepth = Math.min(...map.map((v) => v.depth));
	// Add TOC to list.
	for (let i = 0; i < map.length; i++) {
		map[i].depth -= minDepth - 1;

		insert(map[i], tableFull);
	}

	root.children = [
		{
			type: "list",
			ordered: isNumbered,
			spread: false,
			children: [],
			data: {
				hName: "__META__.TocTop",
				hProperties: {
					isNumbered,
					children: tableFull
				}
			}
		},
		...root.children.slice(0, openingIndex - 1),
		{
			...root.children[openingIndex - 1],
			children: [
				{
					type: "text",
					value: "Contents"
				}
			]
		},
		{
			type: "list",
			ordered: isNumbered,
			spread: false,
			children: [],
			data: {
				hName: "Components.TocMid"
			}
		},
		...root.children.slice(endIndex ?? root.children.length)
	];
}

/**
 * Insert an entry into `parent`.
 *
 * @param {SearchEntry} entry
 * @param {Array<TableEntry>} parent
 */
function insert(entry, parent) {
	// last tail is 2, this is > 5
	// 	run insert on tail
	// last tail is 4, this is <= (e.g., 3, 4)
	// 	append to parent
	const tail = parent.at(-1);
	if (tail && entry.depth > tail.depth) {
		insert(entry, tail.children);
	} else {
		parent.push({
			slug: entry.id,
			name: toString(entry.children, { includeImageAlt: false }),
			depth: entry.depth,
			beforeContentsHeader: entry.beforeStart,
			children: []
		});
	}
}

export function remarkToc() {
	return remarkTocTree;
}

export function rehypeToc() {
	/**
	 * @param {HastRoot} tree
	 */
	return function (tree) {
		// Find the '__META__.TocTop' element
		/** @type {{ isOrdered: boolean; children: Array<TableEntry> } | undefined} */
		let tocTop;
		visit(tree, "element", function (node) {
			if (node.tagName === "__META__.TocTop") {
				tocTop = node.properties;
			}
		});

		if (tocTop) {
			visit(tree, "root", function (root) {
				for (const child of root.children) {
					// Find the child element that declares the layout
					// and update its arguments to include the TOC data
					if (child.type === "raw" && child.value.startsWith("<Layout_MDSVEX_")) {
						child.value =
							child.value.substring(0, child.value.indexOf(">")) +
							` toc={${JSON.stringify(tocTop)}}>`;
					}
				}

				root.children = root.children.filter((n) => n.tagName !== "__META__.TocTop");
			});
		}
	};
}
