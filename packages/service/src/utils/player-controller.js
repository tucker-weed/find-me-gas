import {
    apiGetPlayingData,
    apiPost,
    apiPut,
    apiPostTracks,
    apiPutNewPlaylist,
    apiPutNav,
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
        while (!(!!img.trackPlaying) && breaker < 10) {
            breaker++;
            img = await apiGetPlayingData(this._token);
        }
        if (!(!!img.trackPlaying)) {
            return false
        }
        return img.trackPlaying
    }

    labelCurrentSong = async (label) => {
        const curr = await this.pollSeed()
        await this._engine.labelSong(curr, label)
        return curr
    }

    pollSuggestions = async (uniqueLevel, radioName, seeds, defaultRadio, label, optionalTarget) => {
        if (!(!!seeds)) {
            const seed = await this.pollSeed()
            seeds = [seed]
        }
        let newPlayName = `${(seeds.map(x => x.slice(0, 3))).join(", ")} #` + (this._sessionID % 100000);
        if (radioName != null) {
            newPlayName = radioName
        }
        const trackIds = (await this._engine.quickSuggestions(seeds, uniqueLevel, defaultRadio, label, optionalTarget)).map((elem) => elem.id)
        const radioId = await apiPutNewPlaylist(
            `https://api.spotify.com/v1/users/12168726728/playlists`,
            this._token,
             newPlayName
        );
        // post tracks to the new playlist then auto-play it
        await apiPostTracks(
            `https://api.spotify.com/v1/playlists/${radioId}/tracks`,
            this._token,
            trackIds,
            0
        );
        for (let i = 0; i < 3; i++) {
            await apiPutNav(
                `https://api.spotify.com/v1/me/player/play`,
                this._token,
                radioId
            )
        }
        return trackIds
    }

    next = async () => {
        // POST broken
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
        // POST broken
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
