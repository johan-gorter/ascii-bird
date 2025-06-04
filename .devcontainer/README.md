# Development Container

This directory contains the development container configuration for ASCII Bird.

## What it does

The devcontainer automatically:
- Sets up a Node.js 20 environment
- Initializes all git submodules (including game-icons assets)
- Installs project dependencies including `http-server`
- Configures VS Code with useful extensions and settings
- Forwards port 8080 for the game server

## Usage

### With VS Code
1. Install the "Dev Containers" extension in VS Code
2. Open this repository in VS Code
3. When prompted, click "Reopen in Container" or use Command Palette: "Dev Containers: Reopen in Container"
4. Wait for the container to build and configure
5. Run the game with: `npm start`

### With GitHub Codespaces
1. Click the "Code" button on GitHub
2. Select "Codespaces" tab
3. Click "Create codespace on main"
4. The environment will be automatically configured
5. Run the game with: `npm start`

## What's included

- Node.js 20 runtime
- All git submodules automatically initialized
- Project dependencies installed (including `http-server`)
- VS Code extensions for JavaScript/TypeScript development
- Prettier for code formatting
- Live Server extension for easy preview
