Reopening this repository in a Dev Container

- In VS Code: Command Palette -> "Dev Containers: Reopen in Container" (or use GitHub Codespaces).
- The container builds from .devcontainer/Dockerfile and then runs the postCreateCommand `corepack enable && npm install`.
- To start the app inside the container:
  1. Open a terminal in the container.
  2. npm run dev
  3. Open the forwarded port 3000 in the Ports panel (or click the link shown by Codespaces/Copilot).

Notes
- The devcontainer uses Node 18. If you need a different Node version, change the Dockerfile and devcontainer.json accordingly.
- If you prefer an image instead of building, revert devcontainer.json to use the `image` field.
