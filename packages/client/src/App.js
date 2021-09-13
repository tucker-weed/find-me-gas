import React, { useState } from "react";
import "./App.css";
import axios from "axios";

const config = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST",
  },
};

function App() {
  return (
    <div className="App">
      <div>
        <h2>Spotify Authorization</h2>
        <a href={"http://localhost:6001/spotify/auth"}>Auth</a>
      </div>
      <div>
        <h2>Playlist Creation</h2>
        <form action="http://localhost:6001/spotify/api/" method="post">
          <input type="hidden" name="type" value="createPlaylist" />
          <label>Enter name for new playlist: </label>
          <input type="text" name="playlistName" />
          <br />
          <label>Enter seed playlist ID: </label>
          <input type="text" name="seedId" />
          <br />
          <br />
          <button type="submit">Generate Playlist</button>
        </form>
      </div>
    </div>
  );
}

export default App;
