<script lang="ts">
	import { tryString } from "albtc";
	import { getTableOfContentsContext, type TableOfContentsEntry } from "./layout.svelte";

	const toc = getTableOfContentsContext();
	let props = $props();
</script>

<div class="lg:hidden" {...props}>
	{#if toc.contents}
		<div class="w-fit max-w-full rounded-md bg-slate-800 py-2 shadow">
			{#snippet items(contents: Array<TableOfContentsEntry>, indent: number = 0)}
				{#each contents.filter((c) => !c.beforeContentsHeader) as item, i (item.slug)}
					<li class="relative">
						<!--
						Replace content in {} with the (hopefully correct) value
						Slugs wont work properly but at least the TOC will
						-->
						<a
							href="#{item.slug}"
							class="relative inline-block w-full border-l-4 border-l-transparent py-1 pl-2 pr-6 text-lg text-gray-200 underline decoration-transparent transition-colors duration-75 hover:border-l-blue-400 hover:bg-slate-700 hover:text-white hover:decoration-white active:text-white active:decoration-white"
							style="padding-left: {(indent + 1) * 20 + (toc.isNumbered ? 16 : 0)}px"
							>{#if toc.isNumbered}<span
									class="absolute top-[7px] block translate-x-[calc(-100%-6px)] text-base text-slate-300"
									>{i + 1}.</span
								>{/if}{item.name.replace(/{(.*?)}/g, (p) => {
								return tryString(toc.props[p.substring(1, p.length - 1)]);
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

			{#if toc.contents.length > 0}
				{#if toc?.isNumbered}
					<ol class="text-gray-200">{@render items(toc.contents)}</ol>
				{:else}
					<ul>{@render items(toc.contents)}</ul>
				{/if}
			{/if}
		</div>
	{/if}
</div>
