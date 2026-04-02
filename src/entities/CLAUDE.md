# Entities Layer

Entities define the shape of data. They mirror database tables.

## Rules

- **Types only**: use `type`, never `interface`.
- **Use inheritance**: define base types (e.g., `BaseEntity` with `id`, `createdDate`, `updatedDate`) and extend them using intersection (`&`).
- **Mirror DB schema**: field names must match database column names.
- **One entity per file**: named `{entity-name}.entity.ts`.
- **Related types**: co-locate type aliases (e.g., `SplitType`) with their entity.
