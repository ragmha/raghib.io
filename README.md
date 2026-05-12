# raghib.io

A modern personal blog built with Next.js, TypeScript, Tailwind CSS, and Bun.

## Prerequisites

- [Bun](https://bun.sh/) (required)
- [Node.js](https://nodejs.org/) (for tooling, version in `.nvmrc`)
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
4. Open your browser and visit [http://localhost:3000](http://localhost:3000)

## Node.js Version Management

This project uses a specific Node.js version for tooling, defined in the `.nvmrc` file.

**macOS/WSL2:**

```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
# Restart your terminal, then:
nvm install       # Installs version from .nvmrc
nvm use
node --version
```

**Windows (native):**
Use [nvm-windows](https://github.com/coreybutler/nvm-windows) or run in WSL2 as above.

---

## Apple Health step counter (`/health`)

The site has an automated daily step counter at `/health`. To set it up,
follow [`docs/getting-started.md`](docs/getting-started.md) — it's a
~20-minute one-time setup that wires an iPhone Shortcut, a GitHub PAT, and
three gh-aw workflows together. The privacy invariants are documented in
[`docs/security-model.md`](docs/security-model.md).

---

Feel free to open issues or contribute!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
