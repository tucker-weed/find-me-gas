import axios from "axios";
import {
  apiPost,
} from "./spotify-api-interaction.js";

const DEBUG = false;
let dlUrl = "https://dl-api.onrender.com";

if (DEBUG) {
  dlUrl = "http://127.0.0.1:5000/";
}

/**
 * SongEngine class contains methods which filter or produce songs on spotify
 *
 * @param token - user authenticated access token for API requests
 */
export default class SongEngine {
  _token;

  constructor(token) {
    this._token = token;
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
    _filterSuggestions = async (trackIds, target, seen, numSuggestions) => {
    const newSuggestions = []
    const targetData = {
      danceability: 0.0,
      valence: 0.0,
      energy: 0.0,
      acousticness: 0.0
    }
    const refSongUrl =
      "https://api.spotify.com/v1/audio-features/" + target;
    const receivedTrackData = (await this._apiGet(refSongUrl)).data;
    if (!(!!receivedTrackData.danceability)) {
      return []
    }
    if (!(!!receivedTrackData.valence)) {
      return []
    }
    if (!(!!receivedTrackData.energy)) {
      return []
    }
    if (!(!!receivedTrackData.acousticness)) {
      return []
    }
    targetData.danceability = receivedTrackData.danceability
    targetData.valence = receivedTrackData.valence
    targetData.energy = receivedTrackData.energy
    targetData.acousticness = receivedTrackData.acousticness
    while (trackIds) {
      const songsUrl =
        "https://api.spotify.com/v1/audio-features/?ids=" +
        trackIds.slice(0, 100).join(",");
      if (trackIds.length <= 100) {
        trackIds = false;
      } else {
        trackIds = trackIds.slice(100, trackIds.length);
      }
      const trackData = await this._apiGet(songsUrl);
      const features = trackData.data.audio_features;
      for (let j = 0; j < features.length; j++) {
        if (features[j] != null && !!features[j]["danceability"] && !!features[j]["valence"] && !!features[j]["energy"] && !!features[j]["acousticness"]) {
          newSuggestions.push({
            id: features[j].uri,
            val: Math.pow(features[j].danceability - targetData.danceability, 2) +
                  Math.pow(features[j].valence - targetData.valence, 2) +
                  Math.pow(features[j].energy - targetData.energy, 2) +
                  Math.pow(features[j].acousticness - targetData.acousticness, 2)
          })
        }
      }
    }
    newSuggestions.sort(function (a, b) {
      return a.val - b.val;
    });
    const returnBin = []
    let j = 0
    while (returnBin.length < numSuggestions && j < newSuggestions.length) {
      if (!(!!seen[newSuggestions[j].id])) {
        returnBin.push(newSuggestions[j])
      }
      j += 1
    }
    return returnBin
  };

  _filterSuggestionsWithDL = async (trackIds, label, seen) => {
    const newSuggestions = []
    while (trackIds) {
      const songsUrl =
        "https://api.spotify.com/v1/audio-features/?ids=" +
        trackIds.slice(0, 100).join(",");
      if (trackIds.length <= 100) {
        trackIds = false;
      } else {
        trackIds = trackIds.slice(100, trackIds.length);
      }
      const trackData = await this._apiGet(songsUrl);
      const features = trackData.data.audio_features;
      for (let j = 0; j < features.length; j++) {
        if (features[j] != null && !!features[j]["danceability"] && !!features[j]["valence"] && !!features[j]["energy"] && !!features[j]["acousticness"] && !!features[j]["speechiness"]) {
          newSuggestions.push({
            id: features[j].uri,
            feats: [features[j].danceability,
                  features[j].energy,
                  features[j].speechiness,
                  features[j].acousticness,
                  features[j].valence]
          })
        }
      }
    }
    // Make request
    const body = {
      type: "getSongsInClass",
      tracks: newSuggestions,
      label,
    }
    const receivedTrackData = (await apiPost(dlUrl, body)).data.probs;
    const returnBin = []
    let j = 0
    while (j < receivedTrackData.length) {
      if (!(!!seen[receivedTrackData[j].id])) {
        returnBin.push(receivedTrackData[j].id.split(":")[2])
      }
      j += 1
    }
    return returnBin
  };

  /**
   * Takes an array of seed IDs and produces 100 recommendations
   *
   * @param seeds - an Array of track ID strings
   * @returns - json data with trackIds and response fields
   */
  _getRecommendationsFromSeeds = async (seeds) => {
    const trackIds = []
    let seedString = ""
    for (let i = 0; i < seeds.length; i++) {
      seedString += seeds[i] + (i == seeds.length - 1 ? "" :",")
    }
    const url =
      "https://api.spotify.com/v1/recommendations?limit=100" +
      "&seed_tracks=" +
      seedString +
      "&market=from_token";
    const response = await this._apiGet(url);
    const tracks = response.data.tracks;
    const likeBools = []
    let idString = ""
    for (let i = 0; i < (tracks.length / 2); i++) {
      idString += tracks[i].id + (i == (tracks.length / 2) - 1 ? "" :",")
    }
    const checkLikesUrl =
      "https://api.spotify.com/v1/me/tracks/contains?ids=" +
      idString;
    const response2 = await this._apiGet(checkLikesUrl);
    likeBools.push(...response2.data)
    idString = ""
    for (let i = (tracks.length / 2); i < tracks.length; i++) {
      idString += tracks[i].id + (i == tracks.length - 1 ? "" :",")
    }
    const checkLikesUrl2 =
      "https://api.spotify.com/v1/me/tracks/contains?ids=" +
      idString;
    const response3 = await this._apiGet(checkLikesUrl2);
    likeBools.push(...response3.data)
    for (let i = 0; i < likeBools.length; i++) {
      if (!likeBools[i]) {
        trackIds.push(tracks[i].id)
      }
    }
    return trackIds
  };

filterRoundOne = async (seed, uniqueLevel) => {
  const refPoint = await this._getRecommendationsFromSeeds([seed], [])
  const seedMap = {}
  const seedArray = []
  let filteredTrackIds = refPoint
  filteredTrackIds = await this._filterSuggestions(refPoint, seed, {}, 40)
  for (let i = 0; i < filteredTrackIds.length; i++) { 
    const newId = filteredTrackIds[i].id.split(":")[2]
    const toCompareAgainst = await this._getRecommendationsFromSeeds([newId])
    const newItem = { id: newId, uniqueCount: 0 }
    seedMap[newId] = newItem
    seedArray.push(newItem)
    // TODO can use set logic to make below faster
    for (let j = 0; j < toCompareAgainst.length; j++) { 
      if (!refPoint.includes(toCompareAgainst[j])) {
        seedMap[newId].uniqueCount += 1
      }
    }
  }
  seedArray.sort(function (a, b) {
    return a.uniqueCount - b.uniqueCount;
  });
  // below selects 5 seeds from the list of filtered suggestitons
  // total selected depends on NUM_SUGGESTIONS in quickSuggestions
  let beg = 0
  let end = 10
  if (uniqueLevel != 1) {
    beg = 10 * (uniqueLevel - 1)
    end = 10 * uniqueLevel
  }
  const seedSlice = seedArray.slice(beg, end) 
  return seedSlice.map(x => x.id) 
}

labelSong = async (track, label) => {
    const featUrl =
      "https://api.spotify.com/v1/audio-features/" + track;
    const errorMessage = "error: could not label this track"
    const targData = (await this._apiGet(featUrl)).data;
    if (!(!!targData.danceability)) {
      return errorMessage
    }
    if (!(!!targData.valence)) {
      return errorMessage
    }
    if (!(!!targData.energy)) {
      return errorMessage
    }
    if (!(!!targData.acousticness)) {
      return errorMessage
    }
  // Make request
  const body = {
    type: "labelData",
    label,
    track: [targData.danceability,
      targData.energy,
      targData.speechiness,
      targData.acousticness,
      targData.valence],
  }
  await apiPost(dlUrl, body)
};

quickSuggestions = async (seedTrackList, uniqueLevel, defaultRadio, label, optionalTarget) => {
    const NUM_SUGGESTIONS = 50
    const newTrackIds = []
    const seen = {}
    let suggestionsAdded = 0
    let KILL = false
    const newSeedTrackList = []
    // Uniqueness boost
    const temp = []
    for (let i = 0; i < seedTrackList.length; i++) {
      temp.push(...(await this.filterRoundOne(seedTrackList[i], uniqueLevel)))
    }
    newSeedTrackList.push(...seedTrackList)
    seedTrackList = temp
    const howMany = seedTrackList.length
    // crosscheck, for each seed, against every other seed
    for (let i = 0; i < howMany && !KILL; i++) {
      let newRecs = await this._getRecommendationsFromSeeds([seedTrackList[i]])
      // choose filter target and get highest scoring tracks by similarity
      // TODO change breaking 0th index eventually
      let target = newSeedTrackList[0]
      if (!!optionalTarget) {
        target = optionalTarget
      }
      console.log(suggestionsAdded)
      let filteredTrackIds = null
      if (defaultRadio) {
        filteredTrackIds = await this._filterSuggestions(newRecs, target, seen, 5)
      } else {
        filteredTrackIds = await this._filterSuggestionsWithDL(newRecs, label, seen)
        filteredTrackIds = await this._filterSuggestions(filteredTrackIds, target, seen, 5)
      }
      // fill partition section with tracks
      for (let j = 0; j < filteredTrackIds.length && !KILL; j++) {
        if (suggestionsAdded < NUM_SUGGESTIONS) {
          seen[filteredTrackIds[j].id] = true
          newTrackIds.push(filteredTrackIds[j])
          suggestionsAdded++
        } else if (suggestionsAdded === NUM_SUGGESTIONS) {
          KILL = true
        }
      }
      if (suggestionsAdded < NUM_SUGGESTIONS && i == howMany - 1) {
        i = -1
      }
    }
    return newTrackIds
  }
}
