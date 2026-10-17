/** Universal notification API. Keep notification behavior in one place. */
export { toast } from "sonner";
export type { ExternalToast } from "sonner";

/** API failures can be plain objects as well as Error instances. */
export function getToastErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error &&
      typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
