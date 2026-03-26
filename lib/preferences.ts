export interface UserPreferences {
  font_family: string;
  font_size: string;
  theme: string;
}

export async function pullPreferences(): Promise<UserPreferences | null> {
  try {
    const res = await fetch("/api/preferences");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function pushPreferences(
  prefs: Partial<UserPreferences>
): Promise<void> {
  try {
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
  } catch {
    // Offline — will sync next time
  }
}
