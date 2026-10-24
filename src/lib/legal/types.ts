export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  notice?: string;
}

export interface LegalDocument {
  slug: string;
  title: string;
  description: string;
  introduction: string[];
  highlights: string[];
  sections: LegalSection[];
}
