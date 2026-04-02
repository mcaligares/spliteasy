@AGENTS.md

# Global Rules

- **Types, not interfaces**: never use `interface`, always use `type`. Use intersection (`&`) for inheritance.
- **Standalone functions**: use exported async functions, not factory functions returning objects.
- **Layer conventions**: each layer under `src/` has its own CLAUDE.md with coding conventions. Read the relevant CLAUDE.md before writing code in that layer.
