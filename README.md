<div>
  >_<br />
  <br />
  <span style="color:#c792e9">B R O W S E R</span><br />
  <span style="color: #c3e88d">E X T E N S I O N</span><br />
  <span style="color: #8addff">D E V E L O P M E N T</span><br />
  <span style="color: #ffcb6b">F R A M E W O R K</span><br />
</div>

<br />

# selaras-offline-ext - Browser Extension

Make it offline compatible

A browser extension built with [Bedframe](https://bedframe.dev), a modern framework for cross-browser extension development.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Run tests
bun run test
```

## Project Overview

This is a **overlay extension (content script)** that also full-page options page. The extension is built using the Bedframe framework, which provides a unified development experience across multiple browsers.

### Extension Type

- **Primary**: Overlay extension (content script)

- **Options**: full-page options page

### Supported Browsers

- Chrome
- Brave
- Opera
- Edge
- Firefox
- Safari

## Architecture & Tech Stack

### Core Framework

- **[Bedframe](https://bedframe.dev)** - Cross-browser extension development framework
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Styling & UI

- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Component library

### Development Tools

- **Bun** - Package manager and runtime
- **Vitest** - Testing framework with Happy DOM
- **oxfmt** - Code formatting
- **Oxlint** - Fast linting
- **Lefthook** - Git hooks management

### Quality Assurance

- **Conventional Commits** - Standardized commit messages
- **Commitizen** - Interactive commit prompts
- **Commitlint** - Commit message validation
- **Lint-staged** - Pre-commit linting
- **Changesets** - Version management

## Project Structure

```
src/
├── _config/                 # Configuration files
│   ├── bedframe.config.ts   # Main Bedframe configuration
│   └── tests.config.ts      # Test configuration
├── lib/                     # Utility helpers
│   └── utils.ts             # shadcn/ui utility helpers
├── assets/                  # Static assets
│   └── icons/              # Extension icons
├── components/             # React components
│   ├── app.tsx            # Main app component
│   ├── intro.tsx          # Welcome/intro component
│   └── layout.tsx         # Layout wrapper
│   └── content.tsx        # Content script component
│   └── options.tsx        # Options page component
├── manifests/             # Browser-specific manifests
│   ├── base.manifest.ts   # Base manifest configuration
│   ├── chrome.ts         # Chrome-specific manifest
│   ├── brave.ts         # Brave-specific manifest
│   ├── opera.ts         # Opera-specific manifest
│   ├── edge.ts         # Edge-specific manifest
│   ├── firefox.ts         # Firefox-specific manifest
│   ├── safari.ts         # Safari-specific manifest
├── pages/                # HTML entry points
│   └── main.html          # Main overlay page
│   └── options.html       # Options page
├── scripts/              # Extension scripts
│   └── service-worker.ts # Service worker
│   └── content.tsx       # Content script
├── index.css             # Tailwind + shadcn theme styles
└── components/
    └── theme-provider.tsx # Light/dark theme provider
```

## Configuration

The project configuration is centralized in `src/_config/bedframe.config.ts` and organized into three distinct categories:

### 1. Browser Configuration

Defines which browsers are targeted and their specific manifests:

```typescript
browser: [
  chrome.browser,
  brave.browser,
  opera.browser,
  edge.browser,
  firefox.browser,
  safari.browser,
]
```

### 2. Extension Configuration

Defines the extension type and behavior:

```typescript
extension: {
  type: 'overlay',
  options: 'full-page',
  manifest: [chrome, brave, opera, edge, firefox, safari],
  pages: {
    overlay: 'src/pages/main.html',
  },
}
```

### 3. Development Configuration

Defines the development stack and tooling:

```typescript
development: {
  template: {
    config: {
      framework: 'React',
      language: 'TypeScript',
      packageManager: 'Bun',
      lintFormat: true,
      tests: {/* Test configuration */},
      git: true,
      gitHooks: true,
      commitLint: true,
      changesets: true,
    },
  },
}
```

## Development Workflow

### Git Hooks (Lefthook)

The project uses Lefthook for managing Git hooks:

- **pre-commit**: Runs lint-staged to format and lint changed files
- **commit-msg**: Validates commit messages using conventional commits
- **prepare-commit-msg**: Opens interactive commit prompt with Commitizen

### Available Scripts

```bash
# Development
bun run dev              # Start development server
bun run build            # Build for production
bun run test             # Run tests with coverage
bun run format           # Format code with oxfmt
bun run lint             # Lint code with Oxlint
bun run fix              # Format and lint code
# Extension Management
bun run zip              # Create extension zip file
bun run publish          # Publish extension
bun run version          # Version management with Changesets
# Safari Conversion
bun run convert:safari   # Convert to Safari Web Extension
```

### Testing

- **Framework**: Vitest with Happy DOM
- **Coverage**: Istanbul provider with text, JSON, and HTML reports
- **Setup**: Global test environment with custom setup files

### Code Quality

- **Linting**: Oxlint for fast JavaScript/TypeScript linting
- **Formatting**: oxfmt
- **Type Safety**: TypeScript with strict configuration
- **Conventional Commits**: Standardized commit message format

## Deployment

### Local Building

```bash
# Build for all browsers
bun run build

# Build for specific browser
bun run build --mode chrome
bun run build --mode firefox
```

### Automated Publishing via GitHub Actions

The project uses GitHub Actions for automated publishing to extension stores. The workflow is triggered on pushes to the `main` branch and can also be manually triggered.

#### Workflow: `.github/workflows/mvp.yml`

The **MVP (Make, Version & Publish)** workflow handles the complete release process:

1. **Build & Test**
   - Builds the extension for all browsers
   - Runs formatting and linting
   - Executes unit tests

2. **Version Management**
   - Uses Changesets to create or update release pull requests
   - Automatically manages versioning based on conventional commits

3. **Release Creation**
   - Creates GitHub releases with release notes
   - Generates extension zip files for distribution

4. **Store Publishing**
   - **Chrome Web Store**: Uploads to Chrome Web Store
   - **Firefox Add-ons**: Uploads to Mozilla Add-ons (AMO)
   - **Edge Add-ons**: Uploads to Microsoft Edge Add-ons

#### Required Secrets

The workflow requires the following GitHub secrets for publishing:

**Chrome Web Store:**

- `EXTENSION_ID`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `REFRESH_TOKEN`

**Firefox Add-ons:**

- `WEB_EXT_API_KEY`
- `WEB_EXT_API_SECRET`

**Edge Add-ons:**

- `EDGE_PRODUCT_ID`
- `EDGE_CLIENT_ID`
- `EDGE_CLIENT_SECRET`

### Dependency Management

The project includes automated dependency updates via Dependabot:

- **Schedule**: Weekly updates on Saturdays
- **Strategy**: Version increase for non-dev dependencies
- **Labels**: Automatically labels PRs with 'dependencies'
- **Conventional Commits**: Uses `fix(deps)` prefix for releases

## Key Features

- **Cross-browser compatibility** - Works on Chrome, Brave, Opera, Edge, Firefox, Safari
- **Modern development stack** - React 19, TypeScript, Tailwind CSS
- **Quality assurance** - Automated testing, linting, and formatting
- **Git workflow** - Conventional commits with automated validation
- **Component library** - shadcn/ui components with New York theme
- **Service worker** - Background script for extension functionality
- **Automated publishing** - CI/CD pipeline for extension store deployment

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Resources

- [Bedframe Documentation](https://bedframe.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Conventional Commits](https://www.conventionalcommits.org)
