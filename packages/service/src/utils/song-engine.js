import axios from "axios";

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
  _maxRuns = 6;

  constructor(lookForRelated, playlistId, token, seenSongs) {
    this._playlistId = playlistId;
    this._token = token;
    this._lookForRelated = lookForRelated;
    this._seenSongs = seenSongs;
    this._tracks = {};
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
        !!features[j]["danceability"]
          ? danceArray.push(features[j].danceability)
          : null;
        !!features[j]["valence"] ? valenceArray.push(features[j].valence) : null;
        !!features[j]["energy"] ? energyArray.push(features[j].energy) : null;
        !!features[j]["acousticness"]
          ? acoustArray.push(features[j].acousticness)
          : null;
      }
    }

    danceArray.sort(function (a, b) {
      return a - b;
    });
    valenceArray.sort(function (a, b) {
      return a - b;
    });
    energyArray.sort(function (a, b) {
      return a - b;
    });
    acoustArray.sort(function (a, b) {
      return a - b;
    });
    //   popArray.sort(function (a, b) {
    //     return a - b;
    //   });
    const avgDance =
      danceArray.reduceRight((accum, val) => accum + val) / danceArray.length;
    const avgValence =
      valenceArray.reduceRight((accum, val) => accum + val) /
      valenceArray.length;
    const avgEnergy =
      energyArray.reduceRight((accum, val) => accum + val) / energyArray.length;
    const avgAcoust =
      acoustArray.reduceRight((accum, val) => accum + val) / acoustArray.length;
    //   const avgPop =
    //     popArray.reduceRight((accum, val) => accum + val) / popArray.length;
    const averages = {
      avgDance: Math.round(avgDance * 100) / 100,
      avgValence: Math.round(avgValence * 100) / 100,
      avgEnergy: Math.round(avgEnergy * 100) / 100,
      avgAcoust: Math.round(avgAcoust * 100) / 100,
      avgPop: Math.round(0),
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
    //   const quartsPop = [
    //     Math.round(popArray[Math.round(popArray.length * 0.25)] * 100) / 100,
    //     Math.round(popArray[Math.round(popArray.length * 0.75)] * 100) / 100,
    //     popArray[0],
    //     popArray[popArray.length - 1],
    //   ];
    return {
      quartsDance,
      quartsValence,
      quartsEnergy,
      quartsAcoust,
      quartsPop: [],
      averages,
    };
  };

    /**
   * Takes a string of track IDs and filters the tracks based on state values
   *
   * @param trackIds - an Array of track ID strings
   * @returns - an array of Track Information json
   */
    _collectPlaylistData2 = async (trackIds, refTrack, numSuggestions) => {
    const allArray = []
    const refTrackData = {
      danceability: 0.0,
      valence: 0.0,
      energy: 0.0,
      acousticness: 0.0
    }
    let totalCount = 0
    for (let i = 0; i < refTrack.length; i++) {
      const refSongUrl =
        "https://api.spotify.com/v1/audio-features/" + refTrack[i];
      const currRefTrackData = (await this._apiGet(refSongUrl)).data;
      if (!(!!currRefTrackData.danceability)) {
        return []
      }
      if (!(!!currRefTrackData.valence)) {
        return []
      }
      if (!(!!currRefTrackData.energy)) {
        return []
      }
      if (!(!!currRefTrackData.acousticness)) {
        return []
      }
      totalCount++
      refTrackData.danceability += currRefTrackData.danceability
      refTrackData.valence += currRefTrackData.valence
      refTrackData.energy += currRefTrackData.energy
      refTrackData.acousticness += currRefTrackData.acousticness
    }
    refTrackData.danceability /= totalCount
    refTrackData.valence /= totalCount
    refTrackData.energy /= totalCount
    refTrackData.acousticness /= totalCount

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
        if (features[j] != null && !!features[j]["danceability"] && !!features[j]["valence"] && !!features[j]["energy"] && !!features[j]["acousticness"]) {
          allArray.push({
            id: features[j].uri,
            val: Math.pow(features[j].danceability - refTrackData.danceability, 2) +
                  Math.pow(features[j].valence - refTrackData.valence, 2) +
                  Math.pow(features[j].energy - refTrackData.energy, 2) +
                  Math.pow(features[j].acousticness - refTrackData.acousticness, 2)
          })
        }
      }
    }

    allArray.sort(function (a, b) {
      return a.val - b.val;
    });

    return allArray.slice(0, numSuggestions)
  };

  /**
   * Takes an array of 2 seed IDs and produces 100 recommendations
   *
   * @param artistIds - an Array of artist ID strings
   * @returns - json data with trackIds and response fields
   */
  _getSeededRecs = async (playData, artistIds) => {
    let idString
    if (!!playData.flag) {
      idString = artistIds;
      const url =
      "https://api.spotify.com/v1/recommendations?limit=100" +
      "&seed_tracks=" +
      idString +
      "&market=from_token";
      const response = await this._apiGet(url);
      const tracks = response.data.tracks;
      const trackIds = tracks.map((elem) => elem.id);

      return { trackIds: trackIds, response: response };
    } else {
      idString = artistIds.join(",");
      const allTrackIds = []
      for (let i = 0; i < artistIds.length; i++) {
        const url =
        "https://api.spotify.com/v1/recommendations?limit=100" +
        "&seed_tracks=" +
        artistIds[i] +
        "&market=from_token";
        const response = await this._apiGet(url);
        const tracks = response.data.tracks;
        const trackIds = tracks.map((elem) => elem.id); 
        allTrackIds.push(...trackIds)
      }

      return { trackIds: trackIds, response: response };
    }
  };

  getRandomInt = max => {
    return Math.floor(Math.random() * max);
  };

  quickSuggestions = async (numSuggestions, seedTrackList, optionalTarget) => {
    const howMany = seedTrackList.length
    const partition = numSuggestions / howMany
    const newTrackIds = []
    const freqMap = {}
    let addedCount = 0
    let partAdded = 0
    let KILL = false
    for (let i = 0; i < howMany && !KILL; i++) {
      for (let k = 0; k < howMany && !KILL; k++) {
        const data = await this._getSeededRecs({flag: 1}, [seedTrackList[i]])
        const uniques = []
        for (let j = 0; j < data.trackIds.length; j++) {
          if (!freqMap[data.trackIds[j].id]) {
            uniques.push(data.trackIds[j])
          }
        }
        let target = [seedTrackList[k]]
        if (!!optionalTarget) {
          target = [optionalTarget]
        }
        const trackIds = await this._collectPlaylistData2(uniques, target, numSuggestions)
        let KILLPART = false
        for (let j = 0; j < trackIds.length && !KILL && !KILLPART; j++) {
          if (!freqMap[trackIds[j].id]) {
            freqMap[trackIds[j].id] = true
            const rand = this.getRandomInt(2)
            if (addedCount < numSuggestions && rand !== 1) {
              newTrackIds.push(trackIds[j])
              addedCount++
              partAdded++
            } else if (addedCount === numSuggestions) {
              KILL = true
            } else if (partAdded >= partition) {
              KILLPART = true
            }
          }
        }
      }
      if (i == (howMany - 1) && addedCount < numSuggestions) {
        i = -1
      }
    }
    return newTrackIds.slice(0, numSuggestions)
  }
}
