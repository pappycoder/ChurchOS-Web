/** Only these two token-scoped public form operations omit account credentials. */
export function isAnonymousPublicFormRequest(endpoint: string, method: string) {
  return (
    (method === "GET" && /^forms\/public\/[a-zA-Z0-9_-]+\/meta$/.test(endpoint)) ||
    (method === "POST" && /^forms\/public\/[a-zA-Z0-9_-]+\/submit$/.test(endpoint))
  );
}
