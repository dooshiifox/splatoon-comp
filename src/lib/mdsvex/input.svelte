<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	type InputProps = {
		type: "text" | "password";
		value: string;
		checked?: never;
		placeholder?: string;
		title: string;
		class?: string;
		labelClass?: string;
	} & Pick<HTMLInputAttributes, "autocomplete" | "autocapitalize" | "autocorrect">;
	type CheckboxProps = {
		type: "checkbox";
		value?: never;
		checked: boolean;
		title: string;
		class?: string;
		labelClass?: string;
	};

	let {
		type,
		value = $bindable(""),
		checked = $bindable(false),
		title,
		labelClass = "",
		class: class_ = "",
		...props
	}: InputProps | CheckboxProps = $props();

	let id = $derived(title.replaceAll(" ", "-").toLowerCase());

	let showPassword = $state(false);
	let displayType = $derived(type === "password" ? (showPassword ? "text" : "password") : type);
</script>

{#if type === "text" || type === "password"}
	<div class="{class_} w-full">
		<label for={id} class="{labelClass} mx-4 text-base font-medium text-gray-300">{title}</label>
		<div
			class="mt-1 flex w-full flex-row rounded-xl border border-gray-600 bg-gray-800 text-white ring-blue-500 has-[input.main-input:focus]:ring-2"
		>
			<input
				{id}
				type={displayType}
				class="main-input w-full border-none bg-transparent px-4 py-1 text-lg font-bold placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:ring-0"
				bind:value
				{...props}
			/>

			{#if type === "password" || value}
				<div class="my-auto h-6 w-0.5 shrink-0 bg-slate-700"></div>
			{/if}

			{#if type === "password"}
				{@const pwId = `${id}-show-password`}
				<input
					bind:checked={showPassword}
					class="peer absolute h-0 w-0 opacity-0"
					id={pwId}
					type="checkbox"
				/>
				<label
					for={pwId}
					class="size-9 shrink-0 cursor-pointer p-1 text-gray-300 hover:text-white hover:*:bg-slate-600 peer-focus:outline-none peer-focus-visible:text-white peer-focus-visible:*:bg-slate-600 peer-focus-visible:*:ring-2"
				>
					<span class="sr-only">Is password shown?</span>

					{#if showPassword}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="size-7 rounded-md p-1 ring-blue-500"
						>
							<path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
							<path
								fill-rule="evenodd"
								d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="size-7 rounded-md p-1 ring-blue-500"
						>
							<path
								fill-rule="evenodd"
								d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z"
								clip-rule="evenodd"
							/>
							<path
								d="m10.748 13.93 2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z"
							/>
						</svg>
					{/if}
				</label>
			{:else if value}
				<!-- dont show this if type is password, since it looks odd -->
				<button
					onclick={() => (value = "")}
					class="group size-9 shrink-0 p-1 text-gray-300 hover:text-white focus:outline-none focus-visible:text-white"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-7 rounded-md p-1 ring-blue-500 group-hover:bg-slate-600 group-focus-visible:bg-slate-600 group-focus-visible:ring-2"
					>
						<title>Clear</title>
						<path
							d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>
{:else if type === "checkbox"}
	<div class="{class_} mx-4 flex items-center">
		<input {id} type="checkbox" class="size-5 rounded bg-slate-200 text-blue-500" bind:checked />
		<label for={id} class="{labelClass} flex-1 pl-4 text-lg font-bold text-gray-200">{title}</label>
	</div>
{/if}
