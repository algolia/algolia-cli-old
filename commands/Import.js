const fs = require('fs');
const JSONStream = require('JSONStream');
const through = require('through');
const transform = require('stream-transform');
const Batch = require('batch-stream');
const async = require('async');
const csv = require('csvtojson');
const regexParser = require('regex-parser');
const chalk = require('chalk');
const algolia = require('algoliasearch');
const Base = require('./Base.js');

class ImportScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.defaultTransformations = this.defaultTransformations.bind(this);
    this.suggestions = this.suggestions.bind(this);
    this.checkMemoryUsage = this.checkMemoryUsage.bind(this);
    this.setIndex = this.setIndex.bind(this);
    this.setTransformations = this.setTransformations.bind(this);
    this.setCsvOptions = this.setCsvOptions.bind(this);
    this.conditionallyParseCsv = this.conditionallyParseCsv.bind(this);
    this.importToAlgolia = this.importToAlgolia.bind(this);
    this.indexFiles = this.indexFiles.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia import -s sourcefilepath -a algoliaappid -k algoliaapikey -n algoliaindexname -b batchsize -t transformationfilepath -m maxconcurrency -p csvtojsonparams\n\n';
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

  suggestions() {
    let output = `\nConsider reducing <batchSize> (currently ${
      this.batchSize
    }).`;
    if (this.maxConcurrency > 1)
      output += `\nConsider reducing <maxConcurrency> (currently ${
        this.maxConcurrency
      }).`;
    return output;
  }

  checkMemoryUsage() {
    // Exit early if highMemoryUsage warning occurred in last 30 seconds
    if (this.highMemoryUsage) return false;
    // Get memory usage, and prepare warning message
    const { usedMb, maxHeapMb, percentUsed } = this.getMemoryUsage();
    const name = `Warning: High memory usage`;
    const message = `Memory usage at ${usedMb} MB (${percentUsed}% of heap allocation for this process).`;
    // Issue warning if heap usage exceeds 90% estimated system allocation for node process
    if (usedMb >= maxHeapMb * 0.9) {
      // Set class instance flag to debounce future warnings
      this.highMemoryUsage = true;
      // Output warning
      console.log(
        chalk.white.bgRed(`\n${name}`),
        chalk.red(`\n${message}`),
        chalk.red(`${this.suggestions()}`)
      );
      // Reset flag in 30 seconds
      setTimeout(() => {
        this.highMemoryUsage = false;
      }, 30000);
    }
    return false;
  }

  setIndex(options) {
    // Set Algolia index
    this.client = algolia(options.appId, options.apiKey);
    this.index = this.client.initIndex(options.indexName);
  }

  setTransformations(options) {
    try {
      // Set JSON record transformations
      const transformations = options.transformations
        ? require(this.normalizePath(options.transformations))
        : null;
      // Validate transformations function input param
      const valid = transformations && typeof transformations === 'function';
      // Assign our transformations function using provided custom transformations file if exists
      this.formatRecord = valid ? transformations : this.defaultTransformations;
    } catch (e) {
      throw e;
    }
  }

  setCsvOptions(options) {
    try {
      this.csvOptions = options.csvToJsonParams
        ? JSON.parse(options.csvToJsonParams)
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

  async importToAlgolia(data) {
    // Method to index batches of records in Algolia
    try {
      await this.index.addObjects(data);
      this.importCount += data.length;
      this.writeProgress(`Records indexed: ${this.importCount}`);
    } catch (e) {
      let message = e.message;
      let addendum = e.stack;
      if (e.name === 'AlgoliaSearchRequestTimeoutError') {
        message = `You may be attempting to import batches too large for the network connection.`;
        addendum = this.suggestions();
      }
      console.log(
        chalk.white.bgRed(`\nError: ${e.name}`),
        chalk.red(`\n${message}`),
        chalk.red(addendum)
      );
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
      this.checkMemoryUsage();
      if (this.queue.length() >= this.maxConcurrency) {
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
    console.log(`\nImporting [${filename}]`);
    const jsonStreamOption = isCsv ? null : '*';
    fileStream
      .pipe(this.conditionallyParseCsv(isCsv))
      .pipe(JSONStream.parse(jsonStreamOption))
      .pipe(transform(this.formatRecord))
      .pipe(new Batch({ size: this.batchSize }))
      .pipe(
        through(data => {
          this.queue.push([data]);
        })
      );
  }

  start(program) {
    // Script reads JSON file or directory of JSON files, optionally applies
    // transformations, then batches and indexes the data in Algolia

    // Validate command; if invalid display help text and exit
    this.validate(program, this.message, this.params);

    // Config params
    const options = {
      sourceFilepath: program.sourcefilepath,
      appId: program.algoliaappid,
      apiKey: program.algoliaapikey,
      indexName: program.algoliaindexname,
      objectsPerBatch: program.batchsize || 1000,
      transformations: program.transformationfilepath || null,
      maxConcurrency: program.maxconcurrency || 2,
      csvToJsonParams: program.params || null,
    };
    // Configure Algolia (this.client, this.index)
    this.setIndex(options);
    // Configure source paths (this.directory, this.filenames)
    this.setSource(options);
    // Configure transformations (this.formatRecord)
    this.setTransformations(options);
    // Configure optional csvtojson params (this.csvOptions)
    this.setCsvOptions(options);
    // Configure data upload parameters
    this.maxConcurrency = options.maxConcurrency;
    // Configure number of records to index per batch
    this.batchSize = options.objectsPerBatch;
    // Assign dangerous memory usage flag
    this.highMemoryUsage = false;
    // Assign import count
    this.importCount = 0;
    // Assign async queue
    this.queue = async.queue(this.importToAlgolia, this.maxConcurrency);

    // Execute import
    return this.indexFiles(this.filenames);
  }
}

const importScript = new ImportScript();
module.exports = importScript;
