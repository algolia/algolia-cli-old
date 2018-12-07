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
    this.writeFile = this.writeFile.bind(this);
    this.exportData = this.exportData.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nUsage: $ algolia export -a algoliaappid -k algoliaapikey -n algoliaindexname -o outputpath -p params\n\n';
    this.params = [
      'algoliaappid',
      'algoliaapikey',
      'algoliaindexname',
      'outputpath',
    ];
  }

  writeProgress(count) {
    readLine.cursorTo(process.stdout, 0);
    process.stdout.write(`Records browsed: ~ ${count}`);
  }

  writeFile(hits, options, fileCount) {
    const filename = `algolia-index-${options.indexName}-${fileCount}.json`;
    const filePath = path.resolve(options.outputPath, filename);
    // process.stdout.write(filePath);
    fs.writeFileSync(filePath, JSON.stringify(hits));
    return console.log(`Done writing ${filename}`);
  }

  exportData(options) {
    return new Promise((resolve, reject) => {
      // Instantiate Algolia index
      const client = algolia(options.appId, options.apiKey, keepaliveAgent);
      const index = client.initIndex(options.indexName);

      // Export index
      const browse = index.browseAll('', options.params);
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
          this.writeFile(hits, options, fileCount);
          // Clear array
          hits = [];
        }
      });

      browse.on('end', () => {
        if (hits.length > 0) {
          // Write remaining records to file
          fileCount++;
          this.writeFile(hits, options, fileCount);
        }
        return resolve(
          `\nDone exporting index.\nSee your data here: ${options.outputPath}`
        );
      });

      browse.on('error', err => reject(err));
    });
  }

  async start(program) {
    try {
      // Validate command
      const isValid = this.validate(program, this.message, this.params);
      if (isValid.flag) return console.log(isValid.output);

      // Config params
      const options = {
        appId: program.algoliaappid,
        apiKey: program.algoliaapikey,
        indexName: program.algoliaindexname,
        outputPath: this.normalizePath(program.outputpath),
        params: program.params || { hitsPerPage: 1000 },
      };

      // Export data
      const result = await this.exportData(options);
      return console.log(result);
    } catch (e) {
      throw e;
    }
  }
}

const exportScript = new ExportScript();
module.exports = exportScript;
