import React, { useState } from "react";

const DEBUG = false;
let baseaddr = "https://find-me-gas.herokuapp.com";
 
if (DEBUG) {
  baseaddr = "http://localhost:6001"; 
}

export const SpotifyController = ({ postAuth }) => {
  const [state, setState] = useState({
    loading: false,
    message: "",
    blacklistString: "",
    seeds: [],
    targetIndex: null,
  });
  const [playlistName, setPlaylistName] = useState(null);
  const [tempBlacklist, setTempBlacklist] = useState("");

  const addTempBlacklist = () => {
    let baseString = state.blacklistString;
    if (!(!!baseString)) {
      baseString = "";
    }
    setState({ ...state, blacklistString: baseString + tempBlacklist + "," }); 
  }

  // vvvv API bridge functions vvvv

  const getSuggestions = () => {
    const blstr = tempBlacklist
    setState({ ...state, loading: true });
    if (blstr !== "") {
      const lab = Number(blstr)
      fetch(`${baseaddr}/spotify/api`, {
        method: "POST",
        body: JSON.stringify({ type: "labelCurrentSong",
        label: lab,
        headers: {
          accept: 'application/json',
        },
      }),
      })
        .then((response) => response.json())
        .then((data) => {
          setState({ ...state, loading: false, message: data.message });
        }); 
    } else {
      fetch(`${baseaddr}/spotify/api`, {
        method: "POST",
        body: JSON.stringify({ type: "getSuggestions",
        seeds: state.seeds,
        targetIndex: state.targetIndex,
        radioName: playlistName,
        blacklist: [],
        defaultRadio: false,
        label: 0,
        headers: {
          accept: 'application/json',
        },
      }),
      })
        .then((response) => response.json())
        .then((data) => {
          setState({ ...state, loading: false, message: data.message });
        });
    }
  };

  const checkLogin = () => {
    setState({ ...state, loading: true });
    window.location.href = `${baseaddr}/spotify/auth/loggedin`;
    setState({ ...state, loading: false }); 
  };

  const checkBlacklist = () => {
    if (!(!!state.blacklistString)) {
      return;
    } 
    const newBlString = state.blacklistString.split(",").join("\n")
    setState({ ...state, message: newBlString });
  };

  const checkCurrPlaying = () => {
    setState({ ...state, loading: true });
    fetch(`${baseaddr}/spotify/api`, {
      method: "POST",
      body: JSON.stringify({ type: "getPlaying" }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!!data.data) {
          setState({ ...state, loading: false, message: "spotify:track:" + data.data });
        } else {
          setState({ ...state, loading: false, message: "error: song unavailable" });
        }
      });
  };

  const addToBlacklist = () => {
    setState({ ...state, loading: true });
    fetch(`${baseaddr}/spotify/api`, {
      method: "POST",
      body: JSON.stringify({ type: "getPlaying" }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!!data.data) {
          const uri = "spotify:track:" + data.data;
          let baseString = state.blacklistString;
          if (!(!!baseString)) {
            baseString = "";
          }
          setState({ ...state, loading: false, message: uri, blacklistString: baseString + uri + "," });
        } else {
          setState({ ...state, loading: false, message: "error: song unavailable" });
        }
      });
  };

  const addCurrPlayingSeed = () => {
    const oldState = state
    let oldTarg = null
    if (state.targetIndex != null) {
      oldTarg = state.seeds[state.targetIndex];
    }
    setState({ ...state, loading: true });
    fetch(`${baseaddr}/spotify/api`, {
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
          } else if (oldState.seeds.length === 3) {
            setState({ ...oldState, message: "Error: max number of seeds reached" });
            return 
          }
          newSeeds.push(data.data)
        }
        if (oldState.seeds.length > 0) {
          newSeeds.push(...oldState.seeds)
        }
        let idx = state.targetIndex
        if (oldTarg !== null) {
          idx = newSeeds.findIndex(x => x === oldTarg) 
        }
        setState({ ...state, targetIndex: idx, loading: false, message: data.message, seeds: newSeeds });
      });
  };

  const authorize = () => {
    setState({ ...state, message: "Login success" });
    window.location.href = `${baseaddr}/spotify/auth`;
  };

  // vvvv UI helper functions vvvv

  const clearSeeds = () => {
    setState({ ...state, seeds: [], targetIndex: null })
  }

  const clearTarget = s => {
    setState({ ...state, targetIndex: null, message: "Target cleared, using all seed attributes" }); 
  }

  const createTargetButton = s => (
    <div> 
      <button onClick={() => setTarget(s)}>
        {s}
      </button>
      <br />
    </div>
  );

  const setTarget = s => {
    const idx = state.seeds.findIndex(x => x === s)
    setState({ ...state, targetIndex: idx, message: "Target set to: " + s }); 
  }

  // UI

  return (
    <div>
      <div style={{backgroundColor: "#E9DAC4"}}>
        <h2>Spotify Authorization</h2>
        <button onClick={authorize}>Login</button>
        <br />
        <button onClick={(e) => {e.preventDefault(); checkLogin()}}>Check still authorized</button>
      </div>
      <br />
      <div style={{backgroundColor: "#E9DAC4"}}>
        <div style={{backgroundColor: "#E9DAC4"}}>
          <h2>Radio Generation</h2>
          <label>Enter optional name for radio: </label>
          <input
            type="text"
            name="playlistName"
            onChange={(evt) => setPlaylistName(evt.target.value)}
          />
        </div>
        <br />
        <div style={{backgroundColor: "#E9DAC4"}}>
          <label>Blacklist: </label>
          <input
            type="text"
            name="blacklistString"
            onChange={(evt) => setTempBlacklist(evt.target.value)}
          />
          <br />
          <button onClick={addTempBlacklist}>Add input to blacklist</button>
        </div>
        <br />
        <div style={{backgroundColor: "#E9DAC4"}}>
          <button onClick={(e) => {e.preventDefault(); getSuggestions()}}>Get Current Song Radio</button>
          <br />
          <br />
          <button onClick={(e) => {e.preventDefault(); addCurrPlayingSeed()}}>Add seed to bin</button>
          <br />
          <br />
          <button onClick={(e) => {e.preventDefault(); checkCurrPlaying()}}>Check currently playing song ID</button>
          <br />
          <br />
          <button onClick={(e) => {e.preventDefault(); checkBlacklist()}}>Check blacklist</button>
          <br />
          <br />
          <button onClick={(e) => {e.preventDefault(); addToBlacklist()}}>Add currently playing to blacklist</button>
        </div>
        <br />
        <div style={{backgroundColor: "#E9DAC4"}}>
          <>
            {state.seeds.map(createTargetButton)}
          </> 
          <br />
          <span>{"Current target is " + state.targetIndex + ", " 
                + (state.targetIndex != null ? state.seeds[state.targetIndex] : "")}</span>
          <br />
          <button onClick={clearTarget}>Clear target selection</button> 
          <br />
          <br />
          <button onClick={clearSeeds}>Delete current seeds</button>
          <br />
          <span>{"Current seeds: " + state.seeds}</span>
          <br />
        </div>
        <br />
        <div style={{backgroundColor: "#BD8E83"}}> 
          <span>{state.loading ? "Loading..." : state.message}</span>
        </div> 
      </div>
    </div>
  );
};

export default SpotifyController;
