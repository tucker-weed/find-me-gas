import React, { useState } from "react";

export const SpotifyController = ({ postAuth }) => {
  const [state, setState] = useState({
    loading: false,
    message: "",
    seeds: [],
    targetIndex: null,
  });
  const [playlistName, setPlaylistName] = useState("");
  const [seedId, setSeedId] = useState("");

  const createPlaylist = () => {
    setState({ ...state, loading: true });
    fetch("https://find-me-gas.herokuapp.com/spotify/api", { // https://find-me-gas.herokuapp.com/spotify/api
      method: "POST",
      body: JSON.stringify({ seedId, playlistName, type: "createPlaylist" }),
    })
      .then((response) => response.json())
      .then((data) => {
        setState({ ...state, loading: false, message: data.message });
      });
  };

  const getSuggestions = () => {
    setState({ ...state, loading: true });
    fetch("https://find-me-gas.herokuapp.com/spotify/api", { // https://find-me-gas.herokuapp.com/spotify/api
      method: "POST",
      body: JSON.stringify({ type: "getSuggestions", seeds: state.seeds, targetIndex: state.targetIndex }),
    })
      .then((response) => response.json())
      .then((data) => {
        setState({ ...state, loading: false, message: data.message });
      });
  };

  const addCurrPlayingSeed = () => {
    const oldState = state
    setState({ ...state, loading: true });
    fetch("https://find-me-gas.herokuapp.com/spotify/api", { // https://find-me-gas.herokuapp.com/spotify/api
      method: "POST",
      body: JSON.stringify({ type: "getPlaying" }),
    })
      .then((response) => response.json())
      .then((data) => {
        const newSeeds = []
        if (!!data.data) {
          if (!!oldState.seeds.find(e => e === data.data)) {
            setState({ ...oldState, message: "Error: can't add same seed twice" });
            return
          } else if (oldState.seeds.length === 5) {
            setState({ ...oldState, message: "Error: max number of seeds reached" });
            return 
          }
          newSeeds.push(data.data)
        }
        if (oldState.seeds.length > 0) {
          newSeeds.push(...oldState.seeds)
        }
        setState({ ...state, loading: false, message: data.message, seeds: newSeeds });
      });
  };

  const clearSeeds = () => {
    setState({ ...state, seeds: [], targetIndex: null })
  }

  const createTargetButtons = s => (
    <div> 
      <button onClick={() => setTarget(s)}>
        {s}
      </button>
      <br />
    </div>
  );

  const setTarget = s => {
    const idx = state.seeds.findIndex(x => x === s)
    setState({ ...state, targetIndex: idx, message: "Target set to: " + idx }); 
  }

  const authorize = () => {
    setState({ ...state, message: "Login success" });
    window.location.href = "https://find-me-gas.herokuapp.com/spotify/auth"; // https://find-me-gas.herokuapp.com/spotify/auth 
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
        <button onClick={addCurrPlayingSeed}>Add seed to bin</button>
        <br />
        <br />
        <>
          {state.seeds.map(createTargetButtons)}
        </> 
        <br />
        <button onClick={clearSeeds}>Delete current seeds</button>
        <br />
        <span>{"Current seeds: " + state.seeds}</span>
        <br />
        <br />
        <span>{state.loading ? "Loading..." : state.message}</span>
      </div>
    </div>
  );
};

export default SpotifyController;
