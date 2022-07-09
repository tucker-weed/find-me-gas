import axios from "axios";

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

  _getRandomInt = max => {
    return Math.floor(Math.random() * max);
  };

  /**
   * Takes a string of track IDs and filters the tracks based on state values
   *
   * @param trackIds - an Array of track ID strings
   * @returns - an array of Track Information json
   */
    _filterSuggestions = async (trackIds, target, numSuggestions) => {
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
    return newSuggestions.slice(0, numSuggestions)
  };

  /**
   * Takes an array of seed IDs and produces 100 recommendations
   *
   * @param seeds - an Array of track ID strings
   * @returns - json data with trackIds and response fields
   */
  _getRecommendationsFromSeeds = async (seeds, blacklist) => {
    const allTrackIds = []
    const trackIds = []

    for (let i = 0; i < seeds.length; i++) {
      const url =
      "https://api.spotify.com/v1/recommendations?limit=100" +
      "&seed_tracks=" +
      seeds[i] +
      "&market=from_token";
      const response = await this._apiGet(url);
      const tracks = response.data.tracks;
      trackIds.push(...tracks.map((elem) => elem.id)); 
      allTrackIds.push(...trackIds)
    }
    return trackIds.filter((x) => !blacklist.includes(x));
  };

filterRoundOne = async (seed, uniqueLevel) => {
  const refPoint = await this._getRecommendationsFromSeeds([seed], [])
  const seedMap = {}
  const seedArray = []
  const filteredTrackIds = await this._filterSuggestions(refPoint, seed, 20)
  for (let i = 0; i < filteredTrackIds.length; i++) { 
    const newId = filteredTrackIds[i].id.split(":")[2]
    const toCompareAgainst = await this._getRecommendationsFromSeeds([newId], [])
    const newItem = { id: newId, uniqueCount: 0 }
    seedMap[newId] = newItem
    seedArray.push(newItem)
    for (let j = 0; j < toCompareAgainst.length; j++) { 
      if (!refPoint.includes(toCompareAgainst[j])) {
        seedMap[newId].uniqueCount += 1
      }
    }
  }
  seedArray.sort(function (a, b) {
    return b.uniqueCount - a.uniqueCount;
  });
  console.log(uniqueLevel)
  return seedArray[uniqueLevel].id
}

quickSuggestions = async (numSuggestions, seedTrackList, uniqueLevel, blacklist, optionalTarget) => {
    const howMany = seedTrackList.length
    const partitionSize = numSuggestions / howMany
    const newTrackIds = []
    const seen = {}
    let suggestionsAdded = 0
    let KILL = false
    // Uniqueness boost
    let temp = []
    for (let i = 0; i < howMany; i++) {
      temp.push(await this.filterRoundOne(seedTrackList[i], 19 - (uniqueLevel - 1)))
    }
    let newSeedTrackList = null
    newSeedTrackList = seedTrackList
    seedTrackList = temp

    // crosscheck, for each seed, against every other seed
    for (let i = 0; i < howMany && !KILL; i++) {
      let KILLPART = false
      let partitionTotalAdded = 0 
      let recs1 = await this._getRecommendationsFromSeeds([seedTrackList[i]], blacklist)
      let recs2 = await this._getRecommendationsFromSeeds([seedTrackList[i]], blacklist)
      let newRecs = []
      for (let j = 0; j < recs1.length; j++) {
        const rand1 = this._getRandomInt(2)
        if (rand1 !== 1 && !(!!seen[recs1[j]])) {
          newRecs.push(recs1[j])
        }
        const rand2 = this._getRandomInt(2)
        if (rand2 !== 1 && !(!!seen[recs2[j]])) {
          newRecs.push(recs2[j])
        }
      }
      for (let k = 0; k < howMany && !KILL && !KILLPART; k++) { 
        // choose filter target and gett highest scoring tracks by similarity
        let target = newSeedTrackList[k]
        if (!!optionalTarget) {
          target = optionalTarget
        }
        const filteredTrackIds = await this._filterSuggestions(newRecs, target, 20)
        // fill partition section with tracks
        let KILLMINIPART = false;
        for (let j = 0; j < filteredTrackIds.length && !KILL && !KILLPART && !KILLMINIPART; j++) {
          if (suggestionsAdded < numSuggestions && !(!!seen[filteredTrackIds[j].id])) {
            seen[filteredTrackIds[j].id] = true
            newTrackIds.push(filteredTrackIds[j])
            suggestionsAdded++
            partitionTotalAdded++
          } else if (suggestionsAdded === numSuggestions) {
            KILL = true
          } else if (partitionTotalAdded >= partitionSize) {
            KILLPART = true
          } else if (partitionTotalAdded / (i + 1) >= partitionSize / howMany) {
            KILLMINIPART = true
          }
        }
        if (k == (howMany - 1) && partitionTotalAdded < partitionSize) {
          k = -1
          recs1 = await this._getRecommendationsFromSeeds([seedTrackList[i]], blacklist)
          recs2 = await this._getRecommendationsFromSeeds([seedTrackList[i]], blacklist)
          newRecs = []
          for (let j = 0; j < recs1.length; j++) {
            const rand1 = this._getRandomInt(2)
            if (rand1 !== 1 && !(!!seen[recs1[j]])) {
              newRecs.push(recs1[j])
            }
            const rand2 = this._getRandomInt(2)
            if (rand2 !== 1 && !(!!seen[recs2[j]])) {
              newRecs.push(recs2[j])
            }
          }
        }
      }
      if (i == (howMany - 1) && suggestionsAdded < numSuggestions) {
        i = 0
      }
    }
    return newTrackIds.slice(0, numSuggestions)
  }
}
