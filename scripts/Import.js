const fs = require('fs');
const es = require('event-stream');
const JSONStream = require('JSONStream');
const transform = require('stream-transform');
const Batch = require('batch-stream');
const readLine = require('readline');
const async = require('async');
const csv = require('csvtojson');
const regexParser = require('regex-parser');
const algolia = require('algoliasearch');
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const keepaliveAgent = new HttpsAgent({
  maxSockets: 1,
  maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
  maxKeepAliveTime: 30000, // keepalive for 30 seconds
});
const Base = require('./Base.js');

class ImportScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.defaultTransformations = this.defaultTransformations.bind(this);
    this.writeProgress = this.writeProgress.bind(this);
    this.setIndex = this.setIndex.bind(this);
    this.setTransformations = this.setTransformations.bind(this);
    this.setCsvOptions = this.setCsvOptions.bind(this);
    this.conditionallyParseCsv = this.conditionallyParseCsv.bind(this);
    this.importToAlgolia = this.importToAlgolia.bind(this);
    this.indexFiles = this.indexFiles.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nUsage: $ algolia import -s sourcefilepath -a algoliaappid -k algoliaapikey -n algoliaindexname -b batchsize -t transformationfilepath -m maxconcurrency -p csvtojsonparams\n\n';
    this.params = [
      'sourcefilepath',
      'algoliaappid',
      'algoliaapikey',
      'algoliaindexname',
    ];
  }

  defaultTransformations(data, cb) {
    cb(null, data);
  }

  writeProgress(count) {
    readLine.cursorTo(process.stdout, 0);
    process.stdout.write(`Records indexed: ${count}`);
  }

  setIndex(options) {
    // Set Algolia index
    this.client = algolia(
      options.ALGOLIA_APP_ID,
      options.ALGOLIA_API_KEY,
      keepaliveAgent
    );
    this.index = this.client.initIndex(options.ALGOLIA_INDEX_NAME);
  }

  setTransformations(options) {
    // Set JSON record transformations
    const transformations = options.TRANSFORMATIONS
      ? require(options.TRANSFORMATIONS)
      : null;
    // Validate transformations function input param
    const valid = transformations && typeof transformations === 'function';
    // Assign our transformations function using provided custom transformations file if exists
    this.formatRecord = valid ? transformations : this.defaultTransformations;
  }

  setCsvOptions(options) {
    try {
      this.csvOptions = options.CSV_TO_JSON_PARAMS
        ? JSON.parse(options.CSV_TO_JSON_PARAMS)
        : null;
      if (!this.csvOptions) return;
      const csvToJsonRegexPropertyList = ['includeColumns', 'ignoreColumns'];
      csvToJsonRegexPropertyList.forEach(prop => {
        if (this.csvOptions.hasOwnProperty(prop)) {
          this.csvOptions[prop] = regexParser(this.csvOptions[prop]);
        }
      });
    } catch (e) {
      throw e;
    }
  }

  conditionallyParseCsv(isCsv) {
    // Return the appropriate writestream for piping depending on filetype
    return isCsv
      ? csv(this.csvOptions) // Convert from CSV to JSON
      : transform(this.defaultTransformations); // Do nothing
  }

  async importToAlgolia(data, callback) {
    // Method to index batches of records in Algolia
    // Outputs estimated number of records processed to console
    // Invokes callback when finished so queue can continue processing
    try {
      await this.index.addObjects(data);
      this.importCount += data.length;
      this.writeProgress(this.importCount);
      callback(null);
    } catch (e) {
      throw e;
    }
  }

  indexFiles(filenames) {
    // Recursive method that iterates through an array of filenames, opens a read stream for each file
    // then pipes the read stream through a series of transformations (parse JSON objects, transform
    // them, batch them, index them in Algolia) while imposing a queue so that only so many
    // indexing threads will be run in parallel
    if (filenames.length <= 0) {
      console.log('Done reading files');
      return;
    }
    // Start new file read stream
    // Note: filenames is a reference to the mutable class instance variable this.filenames
    const filename = filenames.pop();
    const file = `${this.directory}/${filename}`;
    const isCsv = filename.split('.').pop() === 'csv';
    const fileStream = fs.createReadStream(file, {
      autoclose: true,
      flags: 'r',
    });

    fileStream.on('data', () => {
      if (this.queue.length() >= this.MAX_CONCURRENCY) {
        // If async upload queue is full, pause reading from file stream
        fileStream.pause();
      }
    });

    fileStream.on('end', () => {
      // File complete, process next file
      this.indexFiles(filenames);
    });

    // Once the async upload queue is drained, resume reading from file stream
    this.queue.drain = () => {
      fileStream.resume();
    };

    // Handle parsing, transforming, batching, and indexing JSON and CSV files
    console.log(`Importing [${filename}]`);
    const jsonStreamOption = isCsv ? null : '*';
    fileStream
      .pipe(this.conditionallyParseCsv(isCsv))
      .pipe(JSONStream.parse(jsonStreamOption))
      .pipe(transform(this.formatRecord))
      .pipe(new Batch({ size: this.CHUNK_SIZE }))
      .pipe(
        es.through(data => {
          this.queue.push([data]);
        })
      );
  }

  start(program) {
    // Script reads JSON file or directory of JSON files, optionally applies
    // transformations, then batches and indexes the data in Algolia

    // Validate command
    const isValid = this.validate(program, this.message, this.params);
    if (isValid.flag) return console.log(isValid.output);

    // Config params
    const OPTIONS = {
      SOURCE_FILEPATH: program.sourcefilepath,
      ALGOLIA_APP_ID: program.algoliaappid,
      ALGOLIA_API_KEY: program.algoliaapikey,
      ALGOLIA_INDEX_NAME: program.algoliaindexname,
      OBJECTS_PER_BATCH: program.batchsize || 5000,
      TRANSFORMATIONS: program.transformationfilepath || null,
      MAX_CONCURRENCY: program.maxconcurrency || 2,
      CSV_TO_JSON_PARAMS: program.params || null,
    };
    // Configure Algolia (this.client, this.index)
    this.setIndex(OPTIONS);
    // Configure source paths (this.directory, this.filenames)
    this.setSource(OPTIONS);
    // Configure transformations (this.formatRecord)
    this.setTransformations(OPTIONS);
    // Configure optional csvtojson params (this.csvOptions)
    this.setCsvOptions(OPTIONS);
    // Configure data upload parameters
    this.MAX_CONCURRENCY = OPTIONS.MAX_CONCURRENCY;
    // Configure number of records to index per batch
    this.CHUNK_SIZE = OPTIONS.OBJECTS_PER_BATCH;
    // Assign import count
    this.importCount = 0;
    // Assign async queue
    this.queue = async.queue(this.importToAlgolia, this.MAX_CONCURRENCY);

    // Execute import
    return this.indexFiles(this.filenames);
  }
}

const importScript = new ImportScript();
module.exports = importScript;
