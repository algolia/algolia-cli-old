const fs = require('fs');
const path = require('path');
const readLine = require('readline');
const algolia = require('algoliasearch');
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const keepaliveAgent = new HttpsAgent({
  maxSockets: 1,
  maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
  maxKeepAliveTime: 30000, // keepalive for 30 seconds
});
const Base = require('./Base.js');

class ExportScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.writeProgress = this.writeProgress.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nUsage: $ algolia export -a algoliaappid -k algoliaapikey -n algoliaindexname -o outputfilepath -p params\n\n';
    this.params = [
      'algoliaappid',
      'algoliaapikey',
      'algoliaindexname',
      'outputfilepath',
    ];
  }

  writeProgress(count) {
    readLine.cursorTo(process.stdout, 0);
    process.stdout.write(`Records browsed: ~ ${count}`);
  }

  start(program) {
    try {
      // Validate command
      const isValid = this.validate(program, this.message, this.params);
      if (isValid.flag) return console.log(isValid.output);

      // Config params
      const appId = program.algoliaappid;
      const apiKey = program.algoliaapikey;
      const indexName = program.algoliaindexname;
      const outputFilepath = this.normalizePath(program.outputfilepath);
      const params = program.params || {};
      params.hitsPerPage = 1000;

      // Instantiate Algolia index
      const client = algolia(appId, apiKey, keepaliveAgent);
      const index = client.initIndex(indexName);

      // Export index
      const browse = index.browseAll('', params);
      let hits = [];
      let hitsCount = 0;
      let fileCount = 0;

      browse.on('result', result => {
        // Push 1000 new hits to array
        hits = hits.concat(result.hits);
        hitsCount += result.hits.length;
        this.writeProgress(hitsCount);
        if (hits.length >= 10000) {
          // Write batch of 10,000 records to file
          fileCount++;
          const filename = `algolia-index-${indexName}-${fileCount}.json`;
          const filePath = path.resolve(outputFilepath, filename);
          fs.writeFileSync(filePath, JSON.stringify(hits), 'utf8', () =>
            console.log(`Done writing ${filename}`)
          );
          // Clear array
          hits = [];
        }
      });

      browse.on('end', () => {
        if (hits.length > 0) {
          // Write remaining records to file
          fileCount++;
          const filename = `algolia-index-${indexName}-${fileCount}.json`;
          const filePath = path.resolve(outputFilepath, filename);
          fs.writeFileSync(filePath, JSON.stringify(hits), 'utf8', () =>
            console.log(`Done writing ${filename}`)
          );
        }
        return console.log(
          `\nDone exporting index.\nSee your data here: ${outputFilepath}`
        );
      });

      browse.on('error', err => {
        throw err;
      });

      return false;
    } catch (e) {
      throw e;
    }
  }
}

const exportScript = new ExportScript();
module.exports = exportScript;
