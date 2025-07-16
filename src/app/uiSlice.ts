import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  videos: [] as string[],
  currentVideo: null as string | null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCurrentVideo: (state, action: PayloadAction<string | null>) => {
      state.currentVideo = action.payload;
    },
    setVideos: (state, action: PayloadAction<string[]>) => {
      state.videos = action.payload;
    },
  },
});
export const { setCurrentVideo, setVideos } = uiSlice.actions;
export default uiSlice.reducer;
