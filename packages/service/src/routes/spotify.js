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

const resolvePayloadToAction = async (payload, res) => {
  switch (payload.type) {
    case "getUser":
      const data = await getSpotifyUser(payload.access_token);
      res.send(data);
      break;
    case "createPlaylist":
      const { access_token, userId, seedId, playlistName } = payload;
      const engine = new SongEngine(false, seedId, access_token, {});
      const trackIds = await engine.algorithm("create", null);
      const createPlaylistResponse = await apiPutNewPlaylist(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        access_token,
        playlistName
      );
      await apiPostTracks(
        `https://api.spotify.com/v1/playlists/${createPlaylistResponse.data.id}/tracks`,
        access_token,
        trackIds.slice(0, 100).map((elem) => elem.uri),
        0
      );
      res.sendStatus(200);
      break;
    default:
      throw new Error("No valid payload to API options");
  }
};

/* GET interactions with Spotify API */
router.post(`${BASE_URL}/api`, function (req, res, next) {
  try {
    resolvePayloadToAction(req.body, res);
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
    const { token } = await authorizeStepTwo(redirect_uri, req.query.code);
    res.send({ token });
  } catch (e) {
    res.send({ error: "Spotify auth: could not get user access token" });
  }
});

export default router;
