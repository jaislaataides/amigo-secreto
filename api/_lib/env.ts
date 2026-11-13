/** URL pública do front-end, usada para montar links embutidos em e-mails. */
export function getAppBaseUrl(): string {
  const url = process.env.APP_BASE_URL;
  if (!url) {
    throw new Error("Missing APP_BASE_URL environment variable");
  }
  return url.replace(/\/$/, "");
}
