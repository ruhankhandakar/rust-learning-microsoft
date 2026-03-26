import pkg from "@/package.json";
import contentHash from "@/public/content-hash.json";

export const APP_VERSION = pkg.version;
export const CONTENT_LAST_UPDATED = contentHash.lastUpdated;
