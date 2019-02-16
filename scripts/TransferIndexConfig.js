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
    this.getIndices = this.getIndices.bind(this);
    this.getConfigOptions = this.getConfigOptions.bind(this);
    this.transferIndexConfig = this.transferIndexConfig.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia transferindexconfig -a sourcealgoliaappid -k sourcealgoliaapikey -n sourcealgoliaindexname -d destinationalgoliaappid -y destinationalgoliaapikey -i destinationindexname -p configParams\n\n';
    this.params = [
      'algoliaappid',
      'algoliaapikey',
      'algoliaindexname',
      'destinationalgoliaappid',
      'destinationalgoliaapikey',
    ];
  }

  getIndices(options) {
    // Instantiate Algolia indices
    const sourceClient = algolia(
      options.sourceAppId,
      options.sourceApiKey,
      keepaliveAgent
    );
    const sourceIndex = sourceClient.initIndex(options.sourceIndexName);

    const destinationClient = algolia(
      options.destinationAppId,
      options.destinationApiKey,
      keepaliveAgent
    );
    const destinationIndex = destinationClient.initIndex(
      options.destinationIndexName
    );

    return { sourceIndex, destinationIndex };
  }

  getConfigOptions(options) {
    // Default config
    const config = {
      sOptions: {},
      rOptions: {},
    };
    // No params provided, exit early
    if (!options.configParams) return config;

    const params = JSON.parse(options.configParams);

    // Set provided options
    if (params.batchSynonymsParams)
      config.sOptions = Object.assign({}, params.batchSynonymsParams);
    if (params.batchRulesParams)
      config.rOptions = Object.assign({}, params.batchRulesParams);

    return config;
  }

  async transferIndexConfig(indices, config) {
    // Transfer settings, synonyms, and query rules
    const settings = await indices.sourceIndex.getSettings();
    const synonyms = await indices.sourceIndex.exportSynonyms();
    const rules = await indices.sourceIndex.exportRules();
    await indices.destinationIndex.setSettings(settings);
    await indices.destinationIndex.batchSynonyms(synonyms, config.sOptions);
    await indices.destinationIndex.batchRules(rules, config.rOptions);
  }

  async start(program) {
    try {
      // Validate command; if invalid display help text
      const isValid = this.validate(program, this.message, this.params);
      if (isValid.flag)
        return console.log(program.help(h => h + isValid.output));

      // Config params
      const options = {
        sourceAppId: program.algoliaappid,
        sourceApiKey: program.algoliaapikey,
        sourceIndexName: program.algoliaindexname,
        destinationAppId: program.destinationalgoliaappid,
        destinationApiKey: program.destinationalgoliaapikey,
        destinationIndexName:
          program.destinationindexname || program.algoliaindexname,
        configParams: program.params || null,
      };

      // Configure Algolia clients/indices
      const indices = this.getIndices(options);
      // Configure batchSynonyms and batchRules options
      const config = this.getConfigOptions(options);
      // Transfer index configuration
      await this.transferIndexConfig(indices, config);

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
