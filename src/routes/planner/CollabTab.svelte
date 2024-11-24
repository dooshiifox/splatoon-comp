<script lang="ts" module>
	import { tryString } from "albtc";

	const COLORS = [
		"#ef4444",
		"#f97316",
		"#eab308",
		"#84cc16",
		"#06b6d4",
		"#6366f1",
		"#a855f7",
		"#e879f9"
	];
	function getRandomColor() {
		return COLORS[Math.floor(Math.random() * COLORS.length)];
	}
</script>

<script lang="ts">
	import Input from "$lib/mdsvex/input.svelte";
	import ColorPicker from "$lib/ColorPicker.svelte";
	import { Color } from "$lib/color.svelte";
	import { fade, slide } from "svelte/transition";
	import { getPlannerContext } from "./+page.svelte";
	import { getHighestContrast } from "$lib/apca";

	let username = $state(localStorage.getItem("previous-username") ?? "");
	let roomName = $state(localStorage.getItem("previous-room") ?? "");
	let color = $state(
		Color.fromRgb(localStorage.getItem("previous-color") ?? getRandomColor()) ??
			Color.fromRgb(getRandomColor())!
	);
	let password = $state("");
	let ctx = getPlannerContext();

	let connectionError = $state();
	function connect() {
		connectionError = undefined;
		localStorage.setItem("previous-username", username);
		localStorage.setItem("previous-room", roomName);
		localStorage.setItem("previous-color", color.rgb);

		let url = "ws://localhost:10999";
		let room = roomName;
		// Allow users to specify custom URLs with the format `<websocket-url>#<room-name>`
		// Make sure the user is targeting a URL with the `wss://` check though
		// No point checking for `ws://` because browser's can't connect to
		// unsecure websockets.
		if (roomName.startsWith("wss://") && roomName.includes("#")) {
			[url, room] = roomName.split("#");
		}

		ctx.roomCollab.connect(url, room, username, color.rgb, password).catch((e) => {
			connectionError = tryString(e);
		});
	}
</script>

{#if !ctx.roomCollab.state}
	<div class="relative p-2">
		<Input
			type="text"
			title="Room Name"
			placeholder="timmys teammates"
			bind:value={roomName}
			autocorrect="off"
			autocapitalize="off"
			autocomplete="off"
		/>

		<Input
			class="mt-2"
			type="password"
			title="Room Password"
			placeholder="Optional"
			bind:value={password}
		/>

		<div class="m-4 mb-3 h-0.5 rounded bg-gray-700"></div>

		<Input
			class="mb-2"
			type="text"
			title="Username"
			placeholder="Timmy T."
			bind:value={username}
			autocorrect="off"
			autocapitalize="off"
			autocomplete="username"
		/>

		<span class="mx-4 text-base font-medium text-gray-300">Username Color</span>
		<ColorPicker bind:color predefined={COLORS} />

		<button
			onclick={connect}
			class="mx-auto mt-6 block rounded-lg border border-slate-500 bg-slate-600 px-6 py-2 text-center font-bold text-white outline-none ring-blue-500 hover:bg-slate-500 focus-visible:ring-2"
			>Join or Create Room</button
		>

		{#if connectionError}
			<p class="px-4 pt-2 text-red-200" transition:slide>{connectionError}</p>
		{/if}

		{#if ctx.roomCollab.connectionState === "connecting"}
			<div class="absolute inset-0 bg-white/50 md:rounded-b-xl" transition:fade={{ duration: 200 }}>
				<svg
					class="h-5 w-5 animate-spin text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			</div>
		{/if}
	</div>
{:else}
	<!--
Session
  - Room name
  - Users
    - Role
    - Kick
    - Change role
  - Admin
    - Change password
    - Change default role
    - Load from save
    - Close room
  - Save
  - Disconnect
-->
	<div class="relative p-2">
		<div class="flex flex-row items-center justify-center gap-3 font-bold text-gray-300">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 16"
				fill="currentColor"
				class="size-4"
			>
				<path
					d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.156 11.763c.16-.629.44-1.21.813-1.72a2.5 2.5 0 0 0-2.725 1.377c-.136.287.102.58.418.58h1.449c.01-.077.025-.156.045-.237ZM12.847 11.763c.02.08.036.16.046.237h1.446c.316 0 .554-.293.417-.579a2.5 2.5 0 0 0-2.722-1.378c.374.51.653 1.09.813 1.72ZM14 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 13c-.552 0-1.013-.455-.876-.99a4.002 4.002 0 0 1 7.753 0c.136.535-.324.99-.877.99H5Z"
				/>
			</svg>

			<p class="text-center">
				{roomName}
			</p>
		</div>

		<ul class="-mr-1 ml-2 mt-4 space-y-2">
			{#each ctx.roomCollab.state.users as user (user.uuid)}
				<li class="flex flex-row items-center gap-4 overflow-visible">
					<div
						class="grid size-7 place-items-center rounded-full text-base font-bold"
						style:color={getHighestContrast(
							["#ffffff", "#000000"],
							user.color.rgbOnBackground("#1e293b")
						)}
						style:background={user.color.rgb}
					>
						<span>{user.username[0]}</span>
					</div>

					<span class="flex-1 truncate text-lg font-bold text-gray-100">{user.username}</span>

					<div class="flex flex-row items-center gap-2 text-gray-300">
						{#if user.access_level === "view"}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								class="size-4"
							>
								<path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
								<path
									fill-rule="evenodd"
									d="M1.38 8.28a.87.87 0 0 1 0-.566 7.003 7.003 0 0 1 13.238.006.87.87 0 0 1 0 .566A7.003 7.003 0 0 1 1.379 8.28ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else if user.access_level === "edit"}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								class="size-4"
							>
								<path
									d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z"
								/>
								<path
									d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z"
								/>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								class="size-4"
							>
								<path
									fill-rule="evenodd"
									d="M11.5 8a3.5 3.5 0 0 0 3.362-4.476c-.094-.325-.497-.39-.736-.15L12.099 5.4a.48.48 0 0 1-.653.033 8.554 8.554 0 0 1-.879-.879.48.48 0 0 1 .033-.653l2.027-2.028c.24-.239.175-.642-.15-.736a3.502 3.502 0 0 0-4.476 3.427c.018.99-.133 2.093-.914 2.7l-5.31 4.13a2.015 2.015 0 1 0 2.828 2.827l4.13-5.309c.607-.78 1.71-.932 2.7-.914L11.5 8ZM3 13.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
									clip-rule="evenodd"
								/>
							</svg>
						{/if}

						<span class="text-sm font-bold capitalize">{user.access_level}</span>
					</div>

					{#if ctx.roomCollab.state.accessLevel === "admin" && user.uuid !== ctx.roomCollab.state.userUuid}
						<button class="-ml-2 rounded p-0.5 text-gray-300 hover:bg-gray-600">
							<span class="sr-only">Edit user</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="size-5"
							>
								<path
									d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"
								/>
							</svg>
						</button>
					{:else}
						<div class="-ml-2 w-2"></div>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/if}
