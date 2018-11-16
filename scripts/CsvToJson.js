const Base = require('./Base.js');
const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const csvToJsonPath = path.join(
  __dirname,
  '../node_modules/csvtojson/bin/csvtojson'
);

class CsvToJsonScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nUsage: $ algolia csvtojson -s sourcefilepath -o outputfilepath\n\n';
    this.params = ['sourcefilepath', 'outputfilepath'];
  }

  start(program) {
    // Validate command
    const isValid = this.validate(program, this.message, this.params);
    if (isValid.flag) return console.log(isValid.output);

    // Config params
    const sourceFilepath = this.normalizePath(program.sourcefilepath);
    const outputFilepath = this.normalizePath(program.outputfilepath);

    // Validate that source filepath exists
    if (!fs.existsSync(sourceFilepath)) {
      return console.log(`Cannot find file or directory: ${sourceFilepath}`);
    }

    // Execute external CSV to JSON module
    exec(
      `${csvToJsonPath} ${sourceFilepath} > ${outputFilepath}`,
      (err, stdout, stderr) => {
        if (err) throw err;
        console.log(`stdout: ${stdout}`, `stderr: ${stderr}`);
      }
    );
    return false;
  }
}

const csvToJsonScript = new CsvToJsonScript();
module.exports = csvToJsonScript;
