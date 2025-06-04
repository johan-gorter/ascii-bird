# ASCII BIRD

Ascii bird is inspired by "flappy bird" built using simple technologies.
It is meant to be a platform that you can easily use "Vibe code" to add new features (obstacles, gameplay etc).

## Getting Started

### Option 1: Development Container (Recommended)
This repository includes a VS Code development container that automatically sets up the environment and initializes submodules.

- **VS Code**: Install the "Dev Containers" extension, open this repo, and select "Reopen in Container"
- **GitHub Codespaces**: Click "Code" → "Codespaces" → "Create codespace on main"

### Option 2: Local Development
#### Cloning the Repository
This repository includes git submodules for assets. To clone with all submodules:

```bash
git clone --recursive https://github.com/your-username/ascii-bird.git
```

Or if you've already cloned the repository:

```bash
git submodule update --init --recursive
```

### Running the Game
You can run the game using:

```bash
npm start
```

Or for development with auto-open browser:

```bash
npm run dev
```

Alternatively, you can use http-server directly:

```bash
npx http-server -c-1 public
```

Then open your browser to the URL shown in the terminal (typically `http://localhost:8080`).

## Assets

This project includes the [game-icons](https://github.com/game-icons/icons) repository as a git submodule under `public/assets/game-icons/`. This provides thousands of high-quality SVG game icons that can be used in the game. The icons are organized by artist and cover a wide range of game elements including weapons, creatures, magic items, and more.

# "AB Architecture"
The architecture is somewhat particular, optimized for AI and vibe coding.
AB stands for "Abstractionless Bus" (and also "ASCII Bird"). The idea behind it is:
- Very modularized, interconnected using bus(es), so AI can keep its context small.
- No abstraction layers, because AI knows the real low-level API's best.

## Error handling
To make vibe coding easier we continue on most errors. Just log the error to the console.
When we add unit-testing, the test runner will monitor console errors and fail the test.

## Notices
This software is released under the Unlicense. For more details, please refer
to the LICENSE file in the root directory of this project.

Artwork and other assets located in the `public/assets` folder are subject
to their own licenses and are attributed accordingly in the `CREDITS.md` file.
