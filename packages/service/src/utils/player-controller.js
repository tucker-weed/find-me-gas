import {
    apiGetPlayingData,
    apiPost,
    apiPut,
    apiPostTracks,
    apiPutNewPlaylist,
  } from "./spotify-api.js";

import SongEngine from "./song-engine.js";
  
export default class PlayerController {
    constructor(token) {
        this._token = token;
        this._engine = new SongEngine(false, "", token, {});
        this._sessionID = Date.now()
    }

    poll = async numSuggestions => {
        let img = { trackPlaying: null };
        while (!(!!img.trackPlaying)) {
            img = await apiGetPlayingData(this._token);
        }
        const trackIds = (await this._engine.quickSuggestions(numSuggestions, img.trackPlaying)).map((elem) => elem.id)
        const createPlaylistResponse = await apiPutNewPlaylist(
            `https://api.spotify.com/v1/users/12168726728/playlists`,
            this._token,
            `Snapshot Session From ${img.songName} #` + (this._sessionID % 100000)
        );
        await apiPostTracks(
            `https://api.spotify.com/v1/playlists/${createPlaylistResponse.data.id}/tracks`,
            this._token,
            trackIds,
            0
        );
        return trackIds
    }

    next = async () => {
        await apiPost("https://api.spotify.com/v1/me/player/next", this._token);
        let img;
        for (let i = 0; i < 1; i++) {
        img = await apiGetPlayingData(this._token);
        }
        return {
        trackData: img
        };
    };

    back = async () => {
        await apiPost("https://api.spotify.com/v1/me/player/previous", this._token);
        let img;
        for (let i = 0; i < 1; i++) {
        img = await apiGetPlayingData(this._token);
        }
        return {
        trackData: img
        };
    };

    play = async () => {
        await apiPut("https://api.spotify.com/v1/me/player/play", this._token);
        let playData;
        for (let i = 0; i < 1; i++) {
        playData = await apiGetPlayingData(this._token);
        }
        return {
        trackData: playData,
        seen: seen
        };
    };

    pause = async () => {
        await apiPut("https://api.spotify.com/v1/me/player/pause", this._token);
        let img;
        for (let i = 0; i < 1; i++) {
        img = await apiGetPlayingData(this._token);
        }
        return {
        trackData: img
        };
    };
}
