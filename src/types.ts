export type TreeItemType = {
  id: string;
  label: string;
  itemType: "directory" | "file";
  children?: TreeItemType[];
};

export type VideoMeta = {
  A: string | null;
  B: string | null;
};
