import React, { useState } from "react";

export const SpotifyController = ({ postAuth }) => {
  const [state, setState] = useState({
    loading: false,
    message: "",
  });
  const [playlistName, setPlaylistName] = useState("");
  const [seedId, setSeedId] = useState("");

  const createPlaylist = () => {
    setState({ ...state, loading: true });
    fetch("https://find-me-gas.herokuapp.com/spotify/api", {
      method: "POST",
      body: JSON.stringify({ seedId, playlistName, type: "createPlaylist" }),
    })
      .then((response) => response.json())
      .then((data) => {
        setState({ loading: false, message: data.message });
      });
  };

  const getSuggestions = () => {
    setState({ ...state, loading: true });
    fetch("https://find-me-gas.herokuapp.com/spotify/api", {
      method: "POST",
      body: JSON.stringify({ type: "getSuggestions" }),
    })
      .then((response) => response.json())
      .then((data) => {
        setState({ loading: false, message: data.message });
      });
  };

  const authorize = () => {
    setState({ ...state, message: "Login success" });
    window.location.href = "https://find-me-gas.herokuapp.com/spotify/auth";
  };

  return (
    <div>
      <div>
        <h2>Spotify Authorization</h2>
        <button onClick={authorize}>Login</button>
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
        <button onClick={getSuggestions}>Get Current Song Radio</button>
        <br />
        <br />
        <span>{state.loading ? "Loading..." : state.message}</span>
      </div>
    </div>
  );
};

export default SpotifyController;
