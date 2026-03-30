export const appConfig = {
  name: 'SplitEasy',
  defaultCurrency: 'ARS',
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  expense: {
    maxAmount: 99_999_999.99,
    maxDescriptionLength: 200,
  },
  group: {
    maxNameLength: 100,
    maxDescriptionLength: 500,
    maxMembers: 50,
  },
} as const;
