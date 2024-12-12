<!-- @component
Creates an `a` tag for use in markdown documents.

If the `href` is to another webpage on the same domain (i.e, starts with `/`),
or to an element on the page (i.e, starts with `#`), then it will navigate in
the same tab. If it is to an external webpage, or starts with a `+`, then it
will open in a new tab.

```svelte
<script>
	import A from "./a.svelte";
</script>

<A href="#my-element">Scroll to #my-element</A>
<A href="/my-webpage">Navigate to `/my-webpage`</A>
<A href="+/my-webpage">Open `/my-webpage` in a new tab</A>
<A href="https://google.com">Open Google in a new tab</A>
```
-->

<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet; href: string };
	let { children, href }: Props = $props();

	let externalLink = $derived(href[0] !== "#" && href[0] !== "/");
</script>

<a
	class="font-sans text-blue-400 visited:text-indigo-400"
	class:mr-4={externalLink}
	href={href.startsWith("+") ? href.substring(1) : href}
	target={externalLink ? "_blank" : "_self"}
	><span class="underline">{@render children()}</span>{#if externalLink}
		<span class="relative">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 16"
				fill="currentColor"
				class="absolute -right-4 top-0 size-4"
				><path
					d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z"
				/><path
					d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z"
				/></svg
			></span
		>{/if}</a
>
