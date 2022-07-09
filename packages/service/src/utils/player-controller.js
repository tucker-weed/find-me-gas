import {
    apiGetPlayingData,
    apiPost,
    apiPut,
    apiPostTracks,
    apiPutNewPlaylist,
  } from "./spotify-api-interaction.js";

import SongEngine from "./song-engine.js";
  
export default class PlayerController {
    constructor(token) {
        this._token = token;
        this._engine = new SongEngine(token);
        this._sessionID = Date.now()
    }

    pollSeed = async () => {
        let img = { trackPlaying: null };
        let breaker = 0;
        while (!(!!img.trackPlaying) && breaker < 20) {
            breaker++;
            img = await apiGetPlayingData(this._token);
        }
        if (!(!!img.trackPlaying)) {
            return false
        }
        return img.trackPlaying
    }

    poll = async (uniqueLevel, numSuggestions, blacklist, radioName, seeds, optionalTarget) => {
        if (!(!!seeds)) {
            const seed = await this.pollSeed()
            seeds = [seed]
        }
        let newPlayName = `${(seeds.map(x => x.slice(0, 3))).join(", ")} #` + (this._sessionID % 100000);
        if (radioName != null) {
            newPlayName = radioName
        }
        const trackIds = (await this._engine.quickSuggestions(numSuggestions, seeds, uniqueLevel, blacklist, optionalTarget)).map((elem) => elem.id)
        const createPlaylistResponse = await apiPutNewPlaylist(
            `https://api.spotify.com/v1/users/12168726728/playlists`,
            this._token,
             newPlayName
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
