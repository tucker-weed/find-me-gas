import axios from "axios";
import PriorityQueue from "./priority-queue.js";
import { getPlaylistTracks } from "./spotify-api.js";

/**
 * SongEngine class contains methods which filter or produce songs on spotify
 *
 * @param state - saved component state which contains user input values
 * @param playlistId - target playlist id to fill with songs
 * @param token - user authenticated access token for API requests
 * @param seenSongs - an Array of track IDs seen already
 */
export default class SongEngine {
  _playlistId;
  _token;
  _lookForRelated;
  _seenSongs;
  _tracks;
  _returnQueue;
  _maxRuns = 4;

  constructor(lookForRelated, playlistId, token, seenSongs) {
    this._playlistId = playlistId;
    this._token = token;
    this._lookForRelated = lookForRelated;
    this._seenSongs = seenSongs;
    this._tracks = {};
    this._returnQueue = new PriorityQueue("count", true);
  }

  /**
   * Requests information based on url and gives a response
   *
   * @param url - the url of the spotify api with a given endpoint
   * @returns - json data being the api response, or an error
   */
  _apiGet = async (url) => {
    return await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this._token}`,
      },
    });
  };

  /**
   * Randomly shuffles an Array in place
   *
   * @param _array - the input Array to be shuffled
   */
  _shuffleArray = (_array) => {
    for (let i = _array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [_array[i], _array[j]] = [_array[j], _array[i]];
    }
  };

  /**
   * Takes a string of track IDs and filters the tracks based on state values
   *
   * @param trackIds - an Array of track ID strings
   * @returns - an array of Track Information json
   */
  _collectPlaylistData = async (popArray, trackIds) => {
    const danceArray = [];
    const valenceArray = [];
    const energyArray = [];
    const acoustArray = [];

    while (trackIds) {
      const songsUrl =
        "https://api.spotify.com/v1/audio-features/?ids=" +
        trackIds.slice(0, 100).join(",");
      if (trackIds.length <= 100) {
        trackIds = null;
      } else {
        trackIds = trackIds.slice(100, trackIds.length);
      }
      const trackData = await this._apiGet(songsUrl);
      const features = trackData.data.audio_features;
      for (let j = 0; j < features.length; j++) {
        features[j]["danceability"]
          ? danceArray.push(features[j].danceability)
          : null;
        features[j]["valence"] ? valenceArray.push(features[j].valence) : null;
        features[j]["energy"] ? energyArray.push(features[j].energy) : null;
        features[j]["acousticness"]
          ? acoustArray.push(features[j].acousticness)
          : null;
      }
    }

    // danceArray.sort(function (a, b) {
    //   return a - b;
    // });
    // valenceArray.sort(function (a, b) {
    //   return a - b;
    // });
    // energyArray.sort(function (a, b) {
    //   return a - b;
    // });
    // acoustArray.sort(function (a, b) {
    //   return a - b;
    // });
    popArray.sort(function (a, b) {
      return a - b;
    });
    const avgDance =
      danceArray.reduceRight((accum, val) => accum + val) / danceArray.length;
    const avgValence =
      valenceArray.reduceRight((accum, val) => accum + val) /
      valenceArray.length;
    const avgEnergy =
      energyArray.reduceRight((accum, val) => accum + val) / energyArray.length;
    const avgAcoust =
      acoustArray.reduceRight((accum, val) => accum + val) / acoustArray.length;
    const avgPop =
      popArray.reduceRight((accum, val) => accum + val) / popArray.length;
    const averages = {
      avgDance: Math.round(avgDance * 100) / 100,
      avgValence: Math.round(avgValence * 100) / 100,
      avgEnergy: Math.round(avgEnergy * 100) / 100,
      avgAcoust: Math.round(avgAcoust * 100) / 100,
      avgPop: Math.round(avgPop),
    };

    const quartsDance = [
      Math.round(danceArray[Math.round(danceArray.length * 0.25)] * 100) / 100,
      Math.round(danceArray[Math.round(danceArray.length * 0.75)] * 100) / 100,
    ];
    const quartsValence = [
      Math.round(valenceArray[Math.round(valenceArray.length * 0.25)] * 100) /
        100,
      Math.round(valenceArray[Math.round(valenceArray.length * 0.75)] * 100) /
        100,
    ];
    const quartsEnergy = [
      Math.round(energyArray[Math.round(energyArray.length * 0.25)] * 100) /
        100,
      Math.round(energyArray[Math.round(energyArray.length * 0.75)] * 100) /
        100,
    ];
    const quartsAcoust = [
      Math.round(acoustArray[Math.round(acoustArray.length * 0.25)] * 100) /
        100,
      Math.round(acoustArray[Math.round(acoustArray.length * 0.75)] * 100) /
        100,
    ];
    const quartsPop = [
      Math.round(popArray[Math.round(popArray.length * 0.25)] * 100) / 100,
      Math.round(popArray[Math.round(popArray.length * 0.75)] * 100) / 100,
      popArray[0],
      popArray[popArray.length - 1],
    ];
    return {
      quartsDance,
      quartsValence,
      quartsEnergy,
      quartsAcoust,
      quartsPop,
      averages,
    };
  };

  /**
   * Takes an array of 2 seed IDs and produces 100 recommendations
   *
   * @param artistIds - an Array of artist ID strings
   * @returns - json data with trackIds and response fields
   */
  _getSeededRecs = async (playData, artistIds) => {
    const idString = artistIds.join(",");
    const url =
      "https://api.spotify.com/v1/recommendations?limit=100&seed_artists=" +
      idString +
      "&market=from_token";
    const response = await this._apiGet(url);
    const tracks = response.data.tracks;
    const trackIds = tracks.map((elem) => elem.id);

    return { trackIds: trackIds, response: response };
  };

  /**
   * Takes an array of Artist json and produces 100 track IDs
   *
   * @param artistIds - an Array of artist ID strings
   */
  _artistsToPlaylist = async (playData, artistIds) => {
    const songsToReturn = [];
    let artistsCopy = artistIds;
    let songsAndResponse = true;
    let runs = 0;
    const MAXSEEDS = 5;

    while (runs < this._maxRuns) {
      const idAccum = [];
      for (let i = 0; i < artistsCopy.length && i < MAXSEEDS; i++) {
        idAccum.push(artistsCopy[i]);
      }

      if (artistsCopy.length === 0) {
        runs += 1;
        this._shuffleArray(artistIds);
        artistsCopy = artistIds;
        songsAndResponse = null;
      } else {
        if (artistsCopy.length > MAXSEEDS) {
          artistsCopy = artistsCopy.slice(MAXSEEDS, artistsCopy.length);
        } else {
          artistsCopy = [];
        }
        songsAndResponse = await this._getSeededRecs(playData, idAccum);
      }

      if (songsAndResponse && songsAndResponse["trackIds"].length > 0) {
        const filtered = songsAndResponse["response"].data.tracks;
        const uniqueSongs = [];
        for (let i = 0; i < filtered.length; i++) {
          const id = filtered[i].id;
          if (!this._tracks[id] && !playData["seedTracks"][id]) {
            const obj = {
              ...filtered[i],
              name: filtered[i]["name"],
              count: 1,
            };
            this._tracks[id] = obj;
            uniqueSongs.push(obj);
          } else if (!playData["seedTracks"][id]) {
            this._tracks[id]["count"] += 1;
          }
        }
        songsToReturn.push(...uniqueSongs);
      }
    }
    songsToReturn.sort((a, b) => b.count - a.count);
    return songsToReturn;
  };
  /**
   * Produces related artists from an Array of artists
   *
   * @param addedArtists - json data containing already considered artists
   * @param max - maximum length allowed for Array to return
   * @returns - an Array of strings, being related artist IDs
   */
  /*
  _getRelatedArtists = async (addedArtists, max) => {
    const onlyArtists = Object.keys(addedArtists);
    this._shuffleArray(onlyArtists);
    const relatedArtists = [];
    for (
      let a = 0;
      a < onlyArtists.length && relatedArtists.length < max;
      a++
    ) {
      const url =
        "https://api.spotify.com/v1/artists/" +
        onlyArtists[a] +
        "/related-artists";
      const response = await this._apiGet(url);

      if (response && response.data.artists[0]) {
        const responseArtists = response.data.artists;
        const relatedPopularity = new PriorityQueue("popularity", true);
        for (let i = 0; i < responseArtists.length; i++) {
          if (!addedArtists[responseArtists[i].id]) {
            relatedPopularity.enqueue(responseArtists[i]);
            addedArtists[responseArtists[i].id] = true;
          }
        }
        const savedSize = relatedPopularity.size();
        for (let i = 0; i < savedSize && i < 3; i++) {
          const relID = relatedPopularity.dequeue().id;
          relatedArtists.push(relID);
        }
      }
    }
    return relatedArtists;
  }; */

  getTrackCounts = () => {
    return this._tracks;
  };

  /**
   * Main entry point for interaction with the spotify api
   *
   * @param mode - a string, either 'filter' or 'create'
   * @param artistSeeds - an Array of artistIds to add, or null
   * @returns - an Array of Track Info Json
   */
  algorithm = async (mode, artistSeeds) => {
    let offset = 0;
    const playlistItems = [];
    const seedTracks = {};

    while (offset != -1) {
      const { data } = await getPlaylistTracks(
        this._playlistId,
        offset,
        this._token
      );
      playlistItems.push(...data.tracks.items);
      if (data["next"]) {
        offset += 100;
      } else {
        offset = -1;
      }
    }

    const artistIds = [];
    const trackIds = [];
    const popArray = [];
    let addedArtists = {};
    let playlistToReturn;

    for (let i = 0; i < playlistItems.length; i++) {
      if (playlistItems[i].track.artists[0]) {
        for (let k = 0; k < playlistItems[i].track.artists.length; k++) {
          const artist_id = playlistItems[i].track.artists[k].id;
          addedArtists[artist_id] = true;
          artistIds.push(playlistItems[i].track.artists[k].id);
        }
      }
      trackIds.push(playlistItems[i].track.id);
      popArray.push(playlistItems[i].track.popularity);
      seedTracks[playlistItems[i].track.id] = true;
    }

    const playData = {
      ...(await this._collectPlaylistData(popArray, trackIds)),
      seedTracks,
    };

    if (mode === "create" && artistSeeds) {
      if (this._lookForRelated) {
        artistIds.push(...Object.keys(addedArtists));
      }
      artistIds.push(...artistSeeds);
      this._shuffleArray(artistIds);
      playlistToReturn = await this._artistsToPlaylist(playData, artistIds);
    } else if (mode === "create") {
      if (this._lookForRelated) {
        artistIds.push(...Object.keys(addedArtists));
      }
      this._shuffleArray(artistIds);
      playlistToReturn = await this._artistsToPlaylist(playData, artistIds);
    } else {
      console.error("Argument 'mode' is restricted to 'filter' or 'create'");
    }

    return playlistToReturn;
  };
}
