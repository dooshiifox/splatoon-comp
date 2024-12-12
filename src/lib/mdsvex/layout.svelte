<script module lang="ts">
	import type { Snippet } from "svelte";
	import h1 from "./h1.svelte";
	import h2 from "./h2.svelte";
	import h3 from "./h3.svelte";
	import p from "./p.svelte";
	import ul from "./ul.svelte";
	import li from "./li.svelte";
	import a from "./a.svelte";
	import blockquote from "./blockquote.svelte";
	import TocMid from "./TocMid.svelte";
	import { createContext } from "$lib/context";
	import { tryString } from "albtc";
	import { page } from "$app/stores";

	// eslint-disable-next-line no-import-assign
	export { h1, h2, h3, p, ul, li, a, blockquote, TocMid };

	export type TableOfContentsEntry = {
		slug: string;
		name: string;
		depth: number;
		beforeContentsHeader: boolean;
		children: Array<TableOfContentsEntry>;
	};
	const tocContext = createContext<{
		readonly contents: Array<TableOfContentsEntry> | undefined;
		readonly isNumbered: boolean;
		readonly props: Record<string, unknown>;
	}>("table-of-contents");
	export const getTableOfContentsContext = tocContext.get;
</script>

<script lang="ts">
	type Props = {
		children: Snippet;
		toc?: { children: Array<TableOfContentsEntry>; isNumbered: boolean };
		title?: string;
		description?: string;
		author?: string;
		last_edited?: string;
		image?: string;
	} & Record<string, unknown>;
	let { children, toc, title, description, author, last_edited, image, ...props }: Props = $props();

	console.log(toc);

	let currentSection = $state(toc?.children[0].slug ?? "");
	tocContext.set({
		get contents() {
			return toc?.children;
		},
		get isNumbered() {
			return toc?.isNumbered ?? false;
		},
		get props() {
			return props;
		}
	});

	$effect(() => {
		const viewheight = Math.min(Math.max(50, 0.2 * window.innerHeight - 100), 200);
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const id = entry.target.getAttribute("id");
					if (entry.isIntersecting && id) {
						currentSection = id;
					}
				});
			},
			{
				rootMargin: `-${viewheight}px 0px -${window.innerHeight - viewheight}px 0px`
			}
		);

		function track(contents: Array<TableOfContentsEntry>) {
			contents.forEach((v) => {
				const el = document.querySelector(`#${v.slug}`);
				if (el) observer.observe(el);
				track(v.children);
			});
		}
		track(toc?.children ?? []);

		return observer.disconnect;
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={$page.url.origin + $page.url.pathname} />
	{#if description}
		<meta name="description" content={description} />
	{/if}
	<meta name="theme-color" content="#111827" />

	{#if last_edited}
		<meta property="article:published_time" content={new Date(last_edited).toISOString()} />
	{/if}
	{#if author}
		<meta property="article:author" content={author} />
		<meta name="author" content={author} />
	{/if}

	<!-- Search engine tags -->
	<meta itemprop="name" content={title} />
	{#if description}
		<meta itemprop="description" content={description} />
	{/if}
	{#if image}
		<meta itemprop="image" content={image} />
	{/if}

	<!-- OpenGraph tags -->
	<meta property="og:url" content={$page.url.origin + $page.url.pathname} />
	<meta property="og:site_name" content="Competitive Splatoon 3" />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	{#if description}
		<meta property="og:description" content={description} />
	{/if}
	{#if image}
		<meta property="og:image" content={image} />
	{/if}

	<!-- Twitter tags -->
	<meta name="twitter:url" content={$page.url.origin + $page.url.pathname} />
	<meta name="twitter:title" content={title} />
	{#if description}
		<meta name="twitter:description" content={description} />
	{/if}
	{#if image}
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:image" content={image} />
	{/if}
</svelte:head>

<div
	class="flex min-h-dvh w-full flex-row justify-center gap-12 bg-gray-900 px-4 pb-40 pt-12 md:pt-28"
>
	<article class="max-w-2xl grow">
		{@render children()}
	</article>

	{#if toc}
		<div
			class="sticky top-16 hidden h-fit max-h-[80vh] w-80 shrink-0 overflow-y-scroll rounded-md py-2 shadow lg:block"
		>
			{#snippet items(contents: Array<TableOfContentsEntry>, indent: number = 0)}
				{#each contents as item, i (item.slug)}
					<li class="relative">
						<!--
						Replace content in {} with the (hopefully correct) value
						Slugs wont work properly but at least the TOC will
						-->
						<a
							href="#{item.slug}"
							class="relative inline-block w-full border-l-4 py-1 pl-2 text-lg text-gray-200 underline decoration-transparent transition-colors duration-75 hover:border-l-blue-400 hover:bg-slate-800 hover:text-white hover:decoration-white"
							class:font-bold={currentSection === item.slug}
							class:border-l-blue-400={currentSection === item.slug}
							class:border-l-transparent={currentSection !== item.slug}
							style="padding-left: {(indent + 1) * 20 + (toc.isNumbered ? 16 : 0)}px"
							>{#if toc.isNumbered}<span
									class="absolute top-[7px] block translate-x-[calc(-100%-6px)] text-base text-slate-300"
									>{i + 1}.</span
								>{/if}{item.name.replace(/{(.*?)}/g, (p) => {
								return tryString(props[p.substring(1, p.length - 1)]);
							})}</a
						>
						{#if item.children.length > 0}
							{#if toc?.isNumbered}
								<ol class="text-gray-200">
									{@render items(item.children, indent + 1)}
								</ol>
							{:else}
								<ul>{@render items(item.children, indent + 1)}</ul>
							{/if}
						{/if}
					</li>
				{/each}
			{/snippet}

			{#if toc.children.length > 0}
				{#if toc?.isNumbered}
					<ol class="text-gray-200">{@render items(toc.children)}</ol>
				{:else}
					<ul>{@render items(toc.children)}</ul>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	:global(#contents) {
		@media (min-width: 1024px) {
			display: none;
		}
	}
</style>
