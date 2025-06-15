// Removed Sentry integration

export async function register() {
  // Sentry integration removed
}

export const onRequestError = (error: Error): void => {
  // Sentry integration removed
  console.error("Request error:", error);
};
