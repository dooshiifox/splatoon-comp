<script lang="ts">
	let { children, ...props } = $props();
</script>

<blockquote {...props} class="my-4 rounded border-l-4 border-blue-400 bg-slate-800 py-2 pl-8 pr-4">
	{@render children()}
</blockquote>
