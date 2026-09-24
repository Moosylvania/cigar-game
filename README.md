# Cigar Country

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## GitHub Pages and showcase

The `Deploy to GitHub Pages` workflow deploys pushes to `main`. In repository
Settings → Pages, set the build source to **GitHub Actions**.

- Game: https://moosylvania.github.io/cigar-game/
- Art showcase: https://moosylvania.github.io/cigar-game/?showcase

The showcase ships in the same build as the game; no separate Pages site is needed.
It starts a temporary review board without loading or autosaving your normal game.
Remove `?showcase` and reload to return to your saved game.

To verify the Pages build locally:

```bash
NUXT_APP_BASE_URL=/cigar-game/ npm run generate
```
