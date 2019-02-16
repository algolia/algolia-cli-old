const algolia = require('algoliasearch');
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const keepaliveAgent = new HttpsAgent({
  maxSockets: 1,
  maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
  maxKeepAliveTime: 30000, // keepalive for 30 seconds
});
const Base = require('./Base.js');

class GetSettingsScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nUsage: $ algolia getsettings -a algoliaappid -k algoliaapikey -n algoliaindexname\n\n';
    this.params = ['algoliaappid', 'algoliaapikey', 'algoliaindexname'];
  }

  async start(program) {
    try {
      // Validate command
      const isValid = this.validate(program, this.message, this.params);
      if (isValid.flag) return console.log(isValid.output);

      // Config params
      const appId = program.algoliaappid;
      const apiKey = program.algoliaapikey;
      const indexName = program.algoliaindexname;

      // Instantiate Algolia index
      const client = algolia(appId, apiKey, keepaliveAgent);
      const index = client.initIndex(indexName);
      // Get index settings
      const settings = await index.getSettings();
      return console.log(JSON.stringify(settings));
    } catch (e) {
      throw e;
    }
  }
}

const getSettingsScript = new GetSettingsScript();
module.exports = getSettingsScript;
