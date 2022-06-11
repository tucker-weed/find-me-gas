import express from "express";
import SimpleDataCache from "../utils/simple-data-cache.js";
import {
    authorizeStepOne,
    authorizeStepTwo,
    getSpotifyUser,
  } from "../utils/spotify-api-interaction.js";
const router = express.Router();

let redirect_uri = "https://find-me-gas.herokuapp.com/spotify/auth/callback";
let redirect_checklogin = "https://find-me-gas-client.herokuapp.com/"
const DEBUG = false;

if (DEBUG) {
  redirect_uri = "http://localhost:6001/spotify/auth/callback"; 
  redirect_checklogin = "http://localhost:3000";
}

/* GET Spotify auth code */
router.get("", function (req, res, next) {
    const scopes =
      "user-read-playback-state user-modify-playback-state user-read-email playlist-modify-private playlist-read-private playlist-modify-public user-library-modify user-library-read";
    authorizeStepOne(res, redirect_uri, scopes);
  });
  
/* GET Spotify access token */
router.get("/callback", async function (req, res, next) {
try {
    const authPayload = await authorizeStepTwo(redirect_uri, req.query.code);
    const token = authPayload.token;
    SimpleDataCache.setData(token);
    const { data } = await getSpotifyUser(token);
    if (!!data) {
    res.redirect(redirect_checklogin);
    } else {
    res.send("error: obtained token is invalid, please retry")
    } 
} catch (e) {
    console.log(e);
    res.send("error: unknown error with spotify auth");
}
});

/* GET Login status */
router.get("/loggedin", async function (req, res, next) {
    let token = null;
    try {
        token = SimpleDataCache.getData();
    } catch (e) {
       // Token expired
       res.send("error: token expired, please log in again") 
       return
    }
    const { data } = await getSpotifyUser(token);
    if (!!data) {
        res.sendStatus(200)
    } else {
        // Token expired
        res.send("error: token expired, please log in again")
    }
});

export default router;
  