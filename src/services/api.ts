import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { TreeItemType, VideoMeta } from "../types";

export const baseUrl = "/api/";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: baseUrl }),
  tagTypes: ["Tree", "Favorites", "Metadata"],
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
    getFavorites: builder.query<string[], void>({
      query: () => `favorites`,
      providesTags: [{ type: "Favorites", id: "LIST" }],
    }),
    toggleFavorites: builder.mutation<void, string>({
      query: (id) => `favorites/${id}`,
      invalidatesTags: [{ type: "Favorites", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTreeQuery,
  useLazyGetVideosQuery,
  useGetMetadataQuery,
  useGetFavoritesQuery,
  useToggleFavoritesMutation,
  useCreateMetadataMutation,
} = apiSlice;
