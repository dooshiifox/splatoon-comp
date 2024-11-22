<script lang="ts" module>
	import { tryString, unreachable } from "albtc";
	import * as v from "valibot";

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
	const PROTOCOL = 1;

	type CallbackCollection<T> = Array<(arg: T) => unknown>;
	class RoomCollab {
		state = $state<"connecting" | "open" | "closing" | "closed">("closed");

		conn: WebSocket | undefined;

		private awaitOpenCallbacks: CallbackCollection<Event> = [];
		private awaitCloseCallbacks: CallbackCollection<CloseEvent> = [];
		private awaitErrorCallbacks: CallbackCollection<Event | undefined> = [];
		private awaitMessageCallbacks: CallbackCollection<MessageEvent | undefined> = [];

		async connect(url: string, room: string, username: string, color?: string, password?: string) {
			if (this.isConnectionOpen()) {
				await this.disconnect();
			}

			let p: Record<string, string> = {
				protocol: PROTOCOL.toString(),
				room,
				username
			};
			if (color) {
				p.color = color;
			}
			if (password) {
				p.password = password;
			}

			try {
				this.conn = new WebSocket(`${url}?${new URLSearchParams(p).toString()}`);
			} catch (e) {
				console.error("Failed to connect to server", e);
				throw new Error("Failed to connect to server.");
			}

			this.state = "connecting";
			this.conn.addEventListener("open", (e) => {
				// Call all open event listeners
				this.state = "open";
				this.awaitOpenCallbacks.forEach((cb) => cb(e));
				this.awaitOpenCallbacks = [];
			});
			this.conn.addEventListener("close", (e) => {
				// Call all close event listeners
				this.state = "closed";
				this.conn = undefined;
				this.awaitCloseCallbacks.forEach((cb) => cb(e));
				this.awaitCloseCallbacks = [];
				this.awaitErrorCallbacks.forEach((cb) => cb(undefined));
				this.awaitErrorCallbacks = [];
				this.awaitMessageCallbacks.forEach((cb) => cb(undefined));
				this.awaitMessageCallbacks = [];
			});
			this.conn.addEventListener("error", (e) => {
				// Call all error event listeners
				this.awaitErrorCallbacks.forEach((cb) => cb(e));
				this.awaitErrorCallbacks = [];
			});
			this.conn.addEventListener("message", (e) => {
				// Call all message event listeners
				this.awaitMessageCallbacks.forEach((cb) => cb(e));
				this.awaitMessageCallbacks = [];
			});

			// Wait for either an error, a close, or a first message
			const event = await Promise.any([this.awaitError(), this.awaitClose(), this.awaitMessage()]);
			if (event === undefined) {
				// `awaitError` and `awaitMessage` can return undefined, only if
				// the socket is closed, but if the socket is closed then
				// `awaitClose` will return first and return an event.
				// If we get undefined, our reasoning has gone wrong somewhere.
				throw new Error("Something went horribly wrong?");
			}

			// If it was an error we received, tell the user
			if (event.type === "error") {
				console.error("Failed to connect to server: Error", event);
				throw new Error("Failed to connect to server.");
			} else if (event.type === "close") {
				// Try parse what type of error it was and give feedback to
				// the user.
				console.log("An issue occured connecting to server: Close", event);
				let reason;
				try {
					reason = JSON.parse((event as CloseEvent).reason);
				} catch {
					console.warn("^^^ JSON parsing error.");
					throw new Error("Failed to connect to server.");
				}

				const validate = v.variant("type", [
					v.object({
						type: v.picklist([
							"room_missing",
							"username_missing",
							"color_invalid",
							"password_required",
							"password_incorrect"
						])
					}),
					v.object({
						type: v.literal("protocol_error"),
						server: v.pipe(v.number(), v.minValue(0))
					}),
					v.object({
						type: v.literal("room_invalid_length"),
						min_len: v.pipe(v.number(), v.minValue(0)),
						max_len: v.pipe(v.number(), v.minValue(0)),
						specified_len: v.pipe(v.number(), v.minValue(0))
					}),
					v.object({
						type: v.literal("username_invalid_length"),
						min_len: v.pipe(v.number(), v.minValue(0)),
						max_len: v.pipe(v.number(), v.minValue(0)),
						specified_len: v.pipe(v.number(), v.minValue(0))
					})
				]);
				const close = v.safeParse(validate, reason);
				if (!close.success) {
					console.warn("^^^ Validation error.");
					throw new Error("Failed to connect to server.");
				}
				const r = close.output;

				if (r.type === "protocol_error") {
					// check our protocol vs the server's
					if (r.server > PROTOCOL) {
						throw new Error(
							"The server is using a newer communication protocol. Try refresh the webpage."
						);
					} else {
						throw new Error(
							"The server is using an outdated communication protocol. Try again shortly, or bug the server admin to update it."
						);
					}
				} else if (r.type === "room_missing") {
					throw new Error("Please specify the name of the room to create or join!");
				} else if (r.type === "room_invalid_length") {
					if (r.min_len > r.specified_len) {
						throw new Error(
							`That room name is too short! Yours is ${r.specified_len} characters, but the minimum is ${r.min_len} characters.`
						);
					} else {
						throw new Error(
							`That room name is too long! Yours is ${r.specified_len} characters, but the maximum is ${r.max_len} characters.`
						);
					}
				} else if (r.type === "username_missing") {
					throw new Error("Please enter a username to join with!");
				} else if (r.type === "username_invalid_length") {
					if (r.min_len > r.specified_len) {
						throw new Error(
							`That username is too short! Yours is ${r.specified_len} characters, but the minimum is ${r.min_len} characters.`
						);
					} else {
						throw new Error(
							`That username is too long! Yours is ${r.specified_len} characters, but the maximum is ${r.max_len} characters.`
						);
					}
				} else if (r.type === "color_invalid") {
					throw new Error("That color doesn't seem valid. Please choose another!");
				} else if (r.type === "password_required") {
					throw new Error("A password is required to join this room.");
				} else if (r.type === "password_incorrect") {
					throw new Error("Sorry, that password isn't correct! Please try again.");
				} else {
					unreachable(r.type);
				}
			} else if (event.type === "message") {
				// Yippee! it worked! now do nothing.
			}
		}

		isConnectionConnecting(): boolean {
			return this.conn !== undefined && this.conn.readyState === this.conn.CONNECTING;
		}
		isConnectionOpen(): boolean {
			return this.conn !== undefined && this.conn.readyState === this.conn.OPEN;
		}
		isConnectionClosed(): boolean {
			return this.conn === undefined || this.conn.readyState === this.conn.CLOSED;
		}

		/** Disconnects from the current client.
		 *
		 *  Resolves after disconnect.
		 */
		async disconnect() {
			// Already disconnected
			if (this.isConnectionClosed()) return;

			const onClose = this.awaitClose();
			// Need to close the connection if not already closing
			// Regardless, we need to await the promise.
			if (this.conn !== undefined && this.conn.readyState !== this.conn.CLOSING) {
				this.conn!.close();
				this.state = "closing";
			}

			await onClose;
			// close event listener handles setting all the state
		}

		/** Awaits for the connection to become open from the connecting state.
		 *
		 *  If the connection is already open, closing, or closed, this will
		 *  resolve instantly.
		 */
		awaitOpen() {
			if (!this.isConnectionConnecting()) return;

			return new Promise<Event>((res) => {
				this.awaitOpenCallbacks.push(res);
			});
		}
		/** Awaits for the connection to close.
		 *
		 *  If the connection is already closed, this will resolve instantly.
		 */
		awaitClose() {
			if (this.isConnectionClosed()) return;

			return new Promise<CloseEvent>((res) => {
				this.awaitCloseCallbacks.push(res);
			});
		}
		/** Awaits for the connection to experience an error.
		 *
		 *  If the connection is closed, this will resolve instantly. If the
		 *  connection closes without an error occurring, this will resolve
		 *  with `undefined`.
		 */
		awaitError() {
			if (this.isConnectionClosed()) return;

			return new Promise<Event | undefined>((res) => {
				this.awaitErrorCallbacks.push(res);
			});
		}
		/** Awaits for the connection to receive a message.
		 *
		 *  If the connection is closed, this will resolve instantly. If the
		 *  connection closes without another message, this will resolve
		 *  with `undefined`.
		 */
		awaitMessage() {
			if (this.isConnectionClosed()) return;

			return new Promise<MessageEvent | undefined>((res) => {
				this.awaitMessageCallbacks.push(res);
			});
		}
	}
</script>

<script lang="ts">
	import Input from "$lib/mdsvex/input.svelte";
	import ColorPicker from "$lib/ColorPicker.svelte";
	import { Color } from "$lib/color.svelte";
	import { fade, slide } from "svelte/transition";

	let username = $state(localStorage.getItem("previous-username") ?? "");
	let roomName = $state(localStorage.getItem("previous-room") ?? "");
	let color = $state(
		Color.fromRgb(localStorage.getItem("previous-color") ?? getRandomColor()) ??
			Color.fromRgb(getRandomColor())!
	);
	let password = $state("");

	let conn = new RoomCollab();
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

		conn.connect(url, room, username, color.rgb, password).catch((e) => {
			connectionError = tryString(e);
		});
	}
</script>

{#if conn.state === "connecting" || conn.state === "closed"}
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

		{#if conn.state === "connecting"}
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
{/if}
