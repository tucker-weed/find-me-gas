import React, { useState } from "react";
import "./App.css";

function App() {
  const [state, setState] = useState({ loading: false, message: "" });
  const [playlistName, setPlaylistName] = useState("");
  const [seedId, setSeedId] = useState("");

  const createPlaylist = () => {
    setState({ ...state, loading: true });
    fetch("http://localhost:6001/spotify/api", {
      method: "POST",
      body: JSON.stringify({ seedId, playlistName, type: "createPlaylist" }),
    })
      .then((response) => response.json())
      .then((data) => {
        setState({ loading: false, message: data.message });
      });
  };

  return (
    <div className="App">
      <div>
        <h2>Spotify Authorization</h2>
        <a href={"http://localhost:6001/spotify/auth"}>Auth</a>
      </div>
      <div>
        <h2>Playlist Creation</h2>
        <label>Enter name for new playlist: </label>
        <input
          type="text"
          name="playlistName"
          onChange={(evt) => setPlaylistName(evt.target.value)}
        />
        <br />
        <label>Enter seed playlist ID: </label>
        <input
          type="text"
          name="seedId"
          onChange={(evt) => setSeedId(evt.target.value)}
        />
        <br />
        <br />
        <button onClick={createPlaylist}>Generate Playlist</button>
        <br />
        <br />
        <span>{state.loading ? "Loading..." : state.message}</span>
      </div>
    </div>
  );
}

export default App;
