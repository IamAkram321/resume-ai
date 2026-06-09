/** Structured resume document — format-agnostic intermediate representation. */

export interface ResumeSection {
  title: string;
  lines: string[];
}

export interface ParsedResume {
  /** Name and contact block before the first section. */
  headerLines: string[];
  sections: ResumeSection[];
}

export interface ResumePdfOptions {
  title?: string;
  targetRole?: string | null;
}
