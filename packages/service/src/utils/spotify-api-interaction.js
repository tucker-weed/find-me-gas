import axios from "axios";

/* AUTH */

export const authorizeStepOne = (res, redirect_uri, scopes) => {
  res.redirect(
    "https://accounts.spotify.com/authorize" +
      "?response_type=code" +
      "&client_id=" +
      "9f5f3af0b5894d44b12973d4a9c2d4d0" +
      (scopes ? "&scope=" + encodeURIComponent(scopes) : "") +
      "&redirect_uri=" +
      encodeURIComponent(redirect_uri)
  );
};

const authOptions = (redirect_uri, code) => ({
  url: "https://accounts.spotify.com/api/token",
  method: "POST",
  params: {
    code: code,
    redirect_uri: redirect_uri,
    grant_type: "authorization_code",
  },
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      Buffer.from(
        "9f5f3af0b5894d44b12973d4a9c2d4d0:be779048aadd4b7ab16ef337860b438c"
      ).toString("base64"),
  },
});

export const authorizeStepTwo = async (redirect_uri, code) => {
  return await axios(authOptions(redirect_uri, code))
    .then((response) => {
      if (response && response.data) {
        return { token: response.data.access_token };
      } else {
        return { token: null };
      }
    })
    .catch((e) => e);
};

/* GET functions */

export const getSpotifyUser = async (accessToken) => {
  return await axios
    .get(`https://api.spotify.com/v1/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((response) => response)
    .catch((e) => e);
};

/**
 * Requests information based on url and gives a response
 *
 * @param url - the url of the spotify api with a given endpoint
 * @returns - a json object being the api response, or an error
 */
export const apiGet = async (url, token) => {
  return await axios
    .get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => response)
    .catch((e) => e);
};

export const apiGetContextUri = async (token) => {
  return await axios
    .get("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      let uri;
      if (response && response.data["context"]) {
        uri = response.data.context.uri;
      }
      return uri;
    })
    .catch((e) => e);
};

export const apiGetPlaylists = async (query, offset, token) => {
  const url =
    "https://api.spotify.com/v1/search?q=" +
    query.split(" ").join("+") +
    "&type=playlist&limit=50&offset=" +
    offset +
    "&market=from_token";
  return await axios
    .get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => response)
    .catch((e) => e);
};

export const getPlaylistTracks = async (pid, offset, token) => {
  const url =
    "https://api.spotify.com/v1/playlists/" +
    pid +
    "/tracks?limit=100&offset=" +
    offset +
    "&market=from_token";
  return await axios
    .get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => response)
    .catch((e) => e);
};

export const apiGetPlayingData = async (token) => {
  return await axios
    .get("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      if (
        response &&
        response.data["item"] &&
        response.data.item["album"] &&
        response.data.item.album.images[0]
      ) {
        return {
          current: response.data.item.album.images[0].url,
          songName: response.data.item.name,
          artistPlaying: response.data.item.album.artists[0].id,
          trackPlaying: response.data.item.id,
          trackDuration: response.data.item.duration_ms,
          tPos: response.data.progress_ms,
        };
      } else {
        return {
          current: "",
          songName: "",
          artistPlaying: "",
          trackPlaying: "",
          trackDuration: "",
          tPos: "",
        };
      }
    })
    .catch((e) => e);
};

/* PUT functions */

export const apiPutTracks = async (url, token, trackIds) => {
  const jsonData = {
    uris: trackIds,
  };
  return await axios
    .put(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
        },
        data: jsonData,
        dataType: "json",
      }
    )
    .then((response) => response)
    .catch((e) => e);
};

export const apiPutNewPlaylist = async (url, token, name) => {
  const jsonData = {
    name,
    public: true,
  };
  let retData = false;
  while (!retData) {
    try {
      retData = await axios({
        url,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        data: JSON.stringify(jsonData),
      })
        .then((response) => response)
      return retData.data.id;
    } catch (e) {
      retData = false
    }
  }
  return retData
};

export const apiPutNav = async (url, token, id) => {
  const jsonData = {
    context_uri: "spotify:user:12168726728:playlist:" + id,
  };
  return await axios
    .put(
      url,
      jsonData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
          Accept: "application/json",
        },
        data: jsonData,
        dataType: "json",
      }
    )
    .then((response) => response)
    .catch((e) => e);
};

export const apiPut = async (url, token) => {
  return await axios
    .put(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
    .then((response) => response)
    .catch((e) => e);
};

/* POST functions */

export const apiPostTracks = async (url, token, trackIds, position) => {
  const jsonData = {
    uris: trackIds,
    position: position,
  };
  let retData = false;
  while (!retData) {
    try {
      await axios({
        url,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        data: JSON.stringify(jsonData),
      })
        .then((response) => response)
      retData = true
    } catch (e) {
      retData = false
    }
  }
};

export const apiPost = async (url, body) => {
  return await axios({
    url,
    method: "POST",
    data: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    }})
    .catch((e) => e);
};

export const apiPostRadioEnv = async (url, token) => {
  const jsonData = {
    name: "PlayautoPlaylist",
  };
  return await axios
    .post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
        },
        data: jsonData,
        dataType: "json",
      }
    )
    .then((response) => response)
    .catch((e) => e);
};
