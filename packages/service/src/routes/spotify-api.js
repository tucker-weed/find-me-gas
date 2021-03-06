import express from "express";
import PlayerController from "../utils/player-controller.js";
import SimpleDataCache from "../utils/simple-data-cache.js";
import _auth_router from "./spotify-auth.js";
 
const router = express.Router();
const _AUTH_BASE_URL = "/auth"


const resolvePayloadToData = async payload => {
  let token = null;
  try {
      token = SimpleDataCache.getData();
  } catch (e) {
      // Token expired
      throw new Error("not logged in"); 
  }
  if (!(!!payload) || (!!payload && !(!!payload.type))) {
    throw new Error("no valid payload to API options"); 
  }
  const collectedData = {
    message: "",
    data: null,
  };
  switch (payload.type) {
    case "getSuggestions":
      {
        const { seeds, targetIndex, radioName, uniqueLevel, defaultRadio, label } = payload;
        let optionalTarget = null
        if (targetIndex != null) {
          optionalTarget = seeds[targetIndex]
        }
        let level = uniqueLevel
        if (!(!!uniqueLevel)) {
          level = 1
        }
        const controller = new PlayerController(token)
        let trackIds = []
        if (!!seeds && !!seeds.length && seeds.length > 0) {
          trackIds = await controller.pollSuggestions(level, radioName, seeds, defaultRadio, label, optionalTarget)
        } else {
          trackIds = await controller.pollSuggestions(level, radioName, null, defaultRadio, label)
        }
        if (trackIds.length > 0) {
          collectedData.message = "Suggested tracks: " + trackIds.join("\n");
        } else {
          collectedData.message = "error: couldn't get currently playing song"
        }
        return collectedData;
      }
    case "getPlaying":
      {
        const controller = new PlayerController(token)
        const trackId = await controller.pollSeed()
        if (trackId) {
          collectedData.message = "Currently playing: " + trackId
          collectedData.data = trackId
        } else {
          collectedData.message = "Error: couldn't get currently playing song"
        }
        return collectedData;
      }
    case "labelCurrentSong":
      {
        const { label } = payload;
        const controller = new PlayerController(token)
        const trackId = await controller.labelCurrentSong(label)
        if (trackId) {
          collectedData.message = "Currently playing song " + trackId + " labeled as " + String(label)
          collectedData.data = trackId
        } else {
          collectedData.message = "Error: couldn't get currently playing song"
        }
        return collectedData;
      }
    default:
      throw new Error("no valid payload to API options");
  }
};

router.post("/api", async function (req, res, next) {
  try {
    const data = await resolvePayloadToData(req.body);
    res.send(data);
  } catch (e) {
    console.log(e);
    res.send({
      message: "error: spotify API received bad payload",
      data: null,
    });
  }
});

router.use(_AUTH_BASE_URL, _auth_router)

export default router;
