# raghib.io

A minimal independent technology blog built with Astro, TypeScript, plain CSS,
and Bun.

## Prerequisites

- [Bun](https://bun.sh/) (required)
- [Node.js](https://nodejs.org/) 20 or newer
- [Git](https://git-scm.com/)

> On Windows, using [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) is recommended for a smoother experience.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/raghib.io.git
   cd raghib.io
   ```
2. Install dependencies (Bun required):
   ```bash
   bun install
   ```
3. Start the development server:
   ```bash
   bun dev
   ```
4. Open your browser and visit [http://localhost:4321](http://localhost:4321)

## Commands

```bash
bun dev       # local development
bun run check # Astro and TypeScript checks
bun run build # static production build
```

## Analytics

The site supports privacy-friendly, cookie-free analytics through [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/). Analytics is enabled only when `PUBLIC_CF_ANALYTICS_TOKEN` is set at build time.

For GitHub Pages deployments:

1. Create a Cloudflare Web Analytics site and copy its beacon token.
2. Add it to the repository as an Actions secret named `CLOUDFLARE_WEB_ANALYTICS_TOKEN`.
3. The Pages workflow injects it into the production build.

For local builds, set `PUBLIC_CF_ANALYTICS_TOKEN` in a local `.env` file. The token identifies the analytics site and is safe to appear in the generated HTML; never put account credentials in the repository.

---

Feel free to open issues or contribute!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
