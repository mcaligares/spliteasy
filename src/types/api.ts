export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
