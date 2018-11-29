const readLine = require('readline');
const algolia = require('algoliasearch');
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const keepaliveAgent = new HttpsAgent({
  maxSockets: 1,
  maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
  maxKeepAliveTime: 30000, // keepalive for 30 seconds
});
const Base = require('./Base.js');

class TransferIndexScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.writeProgress = this.writeProgress.bind(this);
    this.setIndices = this.setIndices.bind(this);
    this.transferIndexConfig = this.transferIndexConfig.bind(this);
    this.setTransformations = this.setTransformations.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nUsage: $ algolia transferindex -a sourcealgoliaappid -k sourcealgoliaapikey -n sourcealgoliaindexname -d destinationalgoliaappid -y destinationalgoliaapikey -i destinationindexname -t transformationfilepath\n\n';
    this.params = [
      'algoliaappid',
      'algoliaapikey',
      'algoliaindexname',
      'destinationalgoliaappid',
      'destinationalgoliaapikey',
    ];
  }

  writeProgress(count) {
    readLine.cursorTo(process.stdout, 0);
    process.stdout.write(`Records transferred: ~ ${count}`);
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
    this.destinationIndex = destinationClient.initIndex(
      options.destinationIndexName
    );
  }

  async transferIndexConfig() {
    // Transfer settings, synonyms, and query rules
    const settings = await this.sourceIndex.getSettings();
    const synonyms = await this.sourceIndex.exportSynonyms();
    const rules = await this.sourceIndex.exportRules();
    const sOptions = {
      forwardToReplicas: true,
      replaceExistingSynonyms: true,
    };
    const rOptions = {
      forwardToReplicas: true,
      clearExistingRules: true,
    };
    await this.destinationIndex.setSettings(settings);
    await this.destinationIndex.batchSynonyms(synonyms, sOptions);
    await this.destinationIndex.batchRules(rules, rOptions);
  }

  setTransformations(options) {
    // Set JSON record transformations
    const transformations = options.transformations
      ? require(options.transformations)
      : null;
    // Validate transformations function input param
    const valid = transformations && typeof transformations === 'function';
    // Assign our transformations function using provided custom transformations file if exists
    this.formatRecord = valid ? transformations : null;
  }

  start(program) {
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
        destinationIndexName:
          program.destinationindexname || program.algoliaindexname,
        transformations: program.transformationfilepath,
      };

      // Configure Algolia clients/indices
      this.setIndices(OPTIONS);
      // Transfer index configuration
      this.transferIndexConfig();
      // Configure transformations
      this.setTransformations(OPTIONS);

      // Export index
      const browse = this.sourceIndex.browseAll('', {
        attributesToRetrieve: ['*'],
      });
      let hitsCount = 0;

      browse.on('result', async result => {
        // Push hits to destination index
        try {
          const hits = this.formatRecord
            ? result.hits.map(this.formatRecord)
            : result.hits;
          await this.destinationIndex.addObjects(hits);
          hitsCount += result.hits.length;
          this.writeProgress(hitsCount);
        } catch (e) {
          throw e;
        }
      });

      browse.on('end', () => console.log('\nDone transferring index.\n'));

      browse.on('error', err => {
        throw err;
      });

      return false;
    } catch (e) {
      throw e;
    }
  }
}

const transferIndexScript = new TransferIndexScript();
module.exports = transferIndexScript;
