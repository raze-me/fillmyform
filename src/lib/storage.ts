import {
  DEFAULT_SYNC_SETTINGS,
  type Profile,
  type ProfileField,
  type SyncSettings,
} from "./schema";


const STORAGE_KEY_PROFILES = "fmf_profiles";
const STORAGE_KEY_SYNC = "fmf_sync_settings";

function makeField(
  fieldId: string,
  label: string,
  type: string,
  synonyms: string[] = []
): ProfileField {
  return {
    fieldId, label, synonyms, value: "", type, isCustom: false 
  };

}
export async function getProfiles(): Promise<Profile[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY_PROFILES);
  return (result[STORAGE_KEY_PROFILES] as Profile[]) || [];
}

export async function saveProfile(profile: Profile): Promise<void> {
  const profiles = await getProfiles();
  const existingIndex = profiles.findIndex(
    (p) => p.profileId === profile.profileId,
  );
  if (existingIndex >= 0) profiles[existingIndex] = profile;
  else profiles.push(profile);

  await chrome.storage.local.set({ [STORAGE_KEY_PROFILES]: profiles });
}

export async function saveAllProfiles(profiles: Profile[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_PROFILES]: profiles });
}

export async function deleteProfile(profileId: string): Promise<void> {
  const profiles = await getProfiles();
  const newProfiles = profiles.filter((p) => p.profileId !== profileId);
  await chrome.storage.local.set({ [STORAGE_KEY_PROFILES]: newProfiles });
}

export async function getSyncSettings(): Promise<SyncSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY_SYNC);
  return (
    (result[STORAGE_KEY_SYNC] as SyncSettings) || { ...DEFAULT_SYNC_SETTINGS }
  );
}

export async function saveSyncSettings(settings: SyncSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_SYNC]: settings });
}

export function createNewProfile(name: string): Profile {
  return {
    profileId: crypto.randomUUID(),
    profileName: name,
    lastUpdated: new Date().toISOString(),
    fields: [
      makeField("first_name", "First Name", "text", ["given name", "forename"]),
      makeField("last_name", "Last Name", "text", ["surname", "family name"]),
      makeField("full_name", "Full Name", "text", ["name"]),
      makeField("email", "Email", "email", ["email address", "e-mail"]),
      makeField("phone", "Phone", "tel", ["phone number", "contact number"]),
      makeField("address_1", "Address Line 1", "text", ["address", "street address"]),
      makeField("address_2", "Address Line 2", "text", ["address 2", "apartment", "suite"]),
      makeField("city", "City", "text", ["town"]),
      makeField("state", "State", "text", ["province", "region"]),
      makeField("zip", "ZIP Code", "text", ["postal code", "zip", "pin code"]),
      makeField("country", "Country", "text"),
      makeField("dob", "Date of Birth", "date", ["birthday", "birth date"]),
    ],
  };
}