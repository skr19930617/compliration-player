import { Box, Grid, Paper } from "@mui/material";
import { useEffect } from "react";

import TreePanel from "./TreePanel";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { setCurrentVideo } from "./app/uiSlice";
import VideoPlayer from "./VideoPlayer";

function App() {
  const dispatch = useAppDispatch();
  const { currentVideo, videos } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (videos.length > 0 && !currentVideo) {
      dispatch(setCurrentVideo(videos[0]));
    }
  }, [dispatch, videos, currentVideo]);

  return (
    <Box sx={{ width: "100%", height: "100vh" }}>
      <Paper elevation={3} sx={{ height: "100%" }}>
        <Grid container spacing={2} padding={2}>
          <Grid size={4}>
            <TreePanel></TreePanel>
          </Grid>

          <Grid size={8}>
            <VideoPlayer></VideoPlayer>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default App;
