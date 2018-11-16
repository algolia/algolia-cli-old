const Base = require('./Base.js');
const path = require('path');
const exec = require('child_process').exec;

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
    const sourceFilepath = program.sourcefilepath;
    const outputFilepath = program.outputfilepath;

    // Execute external CSV to JSON module
    exec(
      `${path.join(__dirname, '../node_modules/csvtojson/bin/csvtojson')} ${sourceFilepath} > ${outputFilepath}`,
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
