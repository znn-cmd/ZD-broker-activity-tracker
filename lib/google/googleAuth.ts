import { google } from "googleapis";

let cachedClient: ReturnType<typeof google.auth.fromJSON> | null = null;

export function getGoogleAuthClient() {
  if (cachedClient) return cachedClient;

  const projectId = process.env.GOOGLE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Google service account environment variables are not set");
  }

  const credentials = {
    type: "service_account",
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  } as const;

  const auth = google.auth.fromJSON(credentials);
  auth.scopes = ["https://www.googleapis.com/auth/spreadsheets"];

  cachedClient = auth;
  return auth;
}

