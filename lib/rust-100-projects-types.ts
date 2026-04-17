export interface Rust100ProjectEntry {
  day: number;
  title: string;
  typeLabel: string;
  status: string;
  chapterSlug: string;
  noteFile: string;
  projectDir: string | null;
}

export interface Rust100Manifest {
  upstreamRepo: string;
  generatedAt: string;
  projects: Rust100ProjectEntry[];
}
