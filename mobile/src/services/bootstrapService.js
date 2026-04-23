import { initializeDb } from "../db/client";
import { getProfile, seedDefaults, setSetting, upsertProfile } from "../db/repositories";
import { createId } from "../utils/id";

export async function bootstrapApp() {
  await initializeDb();

  let profile = await getProfile();
  if (!profile) {
    const now = new Date().toISOString();
    profile = {
      id: createId("profile"),
      full_name: "FlowWallet User",
      pan: null,
      mobile: "9876543210",
      email: "local.user@flowwallet.app",
      created_at: now,
      updated_at: now,
    };
    await upsertProfile(profile);
    await setSetting("bootstrap_complete", "true");
  }

  await seedDefaults(profile.id);
  return profile;
}
