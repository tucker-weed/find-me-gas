class SimpleDataCache {
    millisecondsToLive = 30 * 60 * 1000;
    cache = null;
    getData = this.getData.bind(this);
    setData = this.setData.bind(this);
    resetCache = this.resetCache.bind(this);
    isCacheExpired = this.isCacheExpired.bind(this);
    fetchDate = new Date(0);

    isCacheExpired() {
      return (this.fetchDate.getTime() + this.millisecondsToLive) < new Date().getTime();
    }
    getData() {
      if (!this.cache || this.isCacheExpired()) {
        console.log('expired - fetching new data');
        throw new Error("cache expired");
      } else {
        console.log('cache hit');
        return this.cache
      }
    }
    setData(data) {
        this.fetchDate = new Date();
        this.cache = data;
    }
    resetCache() {
     this.fetchDate = new Date(0);
     this.cache = null
    }
}

const dcache = new SimpleDataCache();

export default dcache;
