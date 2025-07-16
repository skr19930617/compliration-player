import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { TreeItemType, VideoMeta } from "../types";

export const baseUrl = "/api/";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: baseUrl }),
  tagTypes: ["Tree"],
  endpoints: (builder) => ({
    getTree: builder.query<TreeViewBaseItem<TreeItemType>[], void>({
      query: () => "tree",
    }),
    getVideos: builder.query<string[], string>({
      query: (directory) => ({
        url: "videos",
        params: { directory },
      }),
    }),
    getMetadata: builder.query<VideoMeta, string>({
      query: (id) => `video/metadata/${id}`,
    }),
    createMetadata: builder.mutation<void, VideoMeta & { id: string }>({
      query: ({ id, A, B }) => ({
        url: `video/metadata/${id}`,
        method: "POST",
        body: { A: A, B: B }, // Default values for A and B),
      }),
    }),
  }),
});

export const {
  useGetTreeQuery,
  useLazyGetVideosQuery,
  useGetMetadataQuery,
  useCreateMetadataMutation,
} = apiSlice;
