const algolia = require('algoliasearch');
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const keepaliveAgent = new HttpsAgent({
  maxSockets: 1,
  maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
  maxKeepAliveTime: 30000, // keepalive for 30 seconds
});
const Base = require('./Base.js');

class TransferIndexConfigScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.start = this.start.bind(this);
    this.setIndices = this.setIndices.bind(this);
    this.setConfigOptions = this.setConfigOptions.bind(this);
    this.transferIndexConfig = this.transferIndexConfig.bind(this);
    // Define validation constants
    this.message =
      '\nUsage: $ algolia transferindexconfig -a sourcealgoliaappid -k sourcealgoliaapikey -n sourcealgoliaindexname -d destinationalgoliaappid -y destinationalgoliaapikey -p configParams\n\n';
    this.params = [
      'algoliaappid',
      'algoliaapikey',
      'algoliaindexname',
      'destinationalgoliaappid',
      'destinationalgoliaapikey',
    ];
  }

  setIndices(options) {
    // Instantiate Algolia indices
    const sourceClient = algolia(
      options.sourceAppId,
      options.sourceApiKey,
      keepaliveAgent
    );
    this.sourceIndex = sourceClient.initIndex(options.indexName);

    const destinationClient = algolia(
      options.destinationAppId,
      options.destinationApiKey,
      keepaliveAgent
    );
    this.destinationIndex = destinationClient.initIndex(options.indexName);
  }

  setConfigOptions(options) {
    this.sOptions = {};
    this.rOptions = {};
    if (!options.configParams) return;
    const configParams = JSON.parse(options.configParams);
    if (configParams.batchSynonymsParams)
      this.sOptions = configParams.batchSynonymsParams;
    if (configParams.batchRulesParams)
      this.rOptions = configParams.batchRulesParams;
  }

  async transferIndexConfig() {
    // Transfer settings, synonyms, and query rules
    const settings = await this.sourceIndex.getSettings();
    const synonyms = await this.sourceIndex.exportSynonyms();
    const rules = await this.sourceIndex.exportRules();
    await this.destinationIndex.setSettings(settings);
    await this.destinationIndex.batchSynonyms(synonyms, this.sOptions);
    await this.destinationIndex.batchRules(rules, this.rOptions);
  }

  async start(program) {
    try {
      // Validate command
      const isValid = this.validate(program, this.message, this.params);
      if (isValid.flag) return console.log(isValid.output);

      // Config params
      const OPTIONS = {
        sourceAppId: program.algoliaappid,
        sourceApiKey: program.algoliaapikey,
        indexName: program.algoliaindexname,
        destinationAppId: program.destinationalgoliaappid,
        destinationApiKey: program.destinationalgoliaapikey,
        configParams: program.params || null,
      };

      // Configure Algolia clients/indices
      this.setIndices(OPTIONS);
      // Configure batchSynonyms and batchRules options
      this.setConfigOptions(OPTIONS);
      // Transfer index configuration
      await this.transferIndexConfig();

      return console.log(
        'Index settings, synonyms, and query rules transferred successfully.'
      );
    } catch (e) {
      throw e;
    }
  }
}

const transferIndexConfigScript = new TransferIndexConfigScript();
module.exports = transferIndexConfigScript;
