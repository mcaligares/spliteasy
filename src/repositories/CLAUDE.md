# Repository Layer

The repository layer is strictly a **SQL resolver**. It receives parameters, executes a Supabase query, and returns the result. No business logic, no data transformation, no validation.

## Rules

- **Standalone functions**: export individual async functions (e.g., `export async function findUserById(db: DbClient, id: string)`). Do not use factory functions or objects with methods.
- **Try-catch mandatory**: every function must wrap all operations in a try-catch block and re-throw exceptions.
- **Verbose logging**: every function must log entry and completion using `logger.repo('functionName', message, data)` with `performance.now()` timing.
- **Use `maybeSingle()`**: for queries that may return zero or one result, use `.maybeSingle()` instead of `.single()`. Never detect errors via error codes like `PGRST116`.
- **Type casting**: cast Supabase query results to entity types.
- **No business logic**: do not compute, filter, transform, or validate data. That belongs in the service layer.
