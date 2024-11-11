# Splatoon Competitive

This site is meant to serve as an introduction to competitive Splatoon, written by something that is learning as it goes.

# Developing

Any contributions are appreciated.

Ensure [node](https://nodejs.org/en) and [pnpm](https://pnpm.io/) are installed. Exact versions are not required but try have the latest of each.

```
$ node -v
v22.9.0
$ pnpm -v
9.12.2
```

Start the dev server with

```
$ pnpm dev
```

This project uses [Svelte](https://svelte.dev/) with [SvelteKit](https://svelte.dev/docs/kit/introduction). Additionally, it uses [Tailwind](https://tailwindcss.com/) for styling and [mdsvex](https://mdsvex.pngwn.io/) for static Markdown content.

Please ensure all contributed content is written in Typescript and passes the style checks with `pnpm lint`. For VSCode users, recommended extensions to do this for you are located in `.vscode/extensions.json` so the IDE should be able to pick them up.

This website is hosted on Cloudflare Pages. As such, all content should be pre-renderable.
