export type ArborKind = "markdown" | "pdf" | "image";

export interface ArborCollection {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface ArborTag {
  id: string;
  name: string;
}

export interface ArborFile {
  id: string;
  collection_id: string | null;
  kind: ArborKind;
  title: string;
  filename: string | null;
  content: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  tag_ids: string[];
  created_at: string;
  updated_at: string;
}
