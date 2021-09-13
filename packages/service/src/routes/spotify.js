import express from "express";
import SongEngine from "../utils/song-engine.js";
import {
  authorizeStepOne,
  authorizeStepTwo,
  getSpotifyUser,
  apiPutNewPlaylist,
  apiPostTracks,
} from "../utils/spotify-api.js";
const router = express.Router();
const BASE_URL = "/spotify";
const redirect_uri = "http://localhost:6001/spotify/auth/callback";
let token = "";
let userId = "";

const resolvePayloadToAction = async (payload, res) => {
  const collectedData = {
    message: "",
    data: null,
  };
  switch (payload.type) {
    case "createPlaylist":
      const { seedId, playlistName } = payload;
      const engine = new SongEngine(false, seedId, token, {});
      const trackIds = await engine.algorithm("create", null);
      const createPlaylistResponse = await apiPutNewPlaylist(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        token,
        playlistName
      );
      await apiPostTracks(
        `https://api.spotify.com/v1/playlists/${createPlaylistResponse.data.id}/tracks`,
        token,
        trackIds.slice(0, 100).map((elem) => elem.uri),
        0
      );
      collectedData.message = "Successfully created a new playlist"
      return collectedData;
    default:
      throw new Error("No valid payload to API options");
  }
};

/* GET interactions with Spotify API */
router.post(`${BASE_URL}/api`, async function (req, res, next) {
  try {
    const data = await resolvePayloadToAction(req.body, res);
    res.redirect(`http://localhost:3000/api_success/${data}`);
  } catch (e) {
    console.log(e);
    res.send({ error: "Spotify API: bad payload" });
  }
});

/* GET Spotify auth code */
router.get(`${BASE_URL}/auth`, function (req, res, next) {
  const scopes =
    "user-read-email playlist-modify-private playlist-read-private playlist-modify-public user-library-modify";
  authorizeStepOne(res, redirect_uri, scopes);
});

/* GET Spotify access token */
router.get(`${BASE_URL}/auth/callback`, async function (req, res, next) {
  try {
    const authPayload = await authorizeStepTwo(redirect_uri, req.query.code);
    token = authPayload.token;
    const { data } = await getSpotifyUser(token);
    userId = data.id;
    res.redirect(`http://localhost:3000/auth_success`);
  } catch (e) {
    console.log(e);
    res.send({ error: "Spotify auth: could not get user access token" });
  }
});

export default router;
