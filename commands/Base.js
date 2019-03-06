const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Base {
  validate(program, message, params) {
    let flag = false;
    let output = message;
    params.forEach(param => {
      if (!program[param]) {
        output += chalk.red(`Must specify ${param}\n`);
        flag = true;
      }
    });
    if (flag) return program.help(h => h + output);
    else return { flag, output };
  }

  normalizePath(input) {
    // Convert path input param to valid system absolute path
    // Path is absolute, originating from system root
    if (path.isAbsolute(input)) return input;
    // Path is relative to user's home directory
    if (input[0] === '~') return path.join(os.homedir(), input.substr(1));
    // Path is relative to current directory
    return path.resolve(process.cwd(), input);
  }

  setSource(options) {
    // Set source directory and filenames array
    // Used to process path inputs that may either be a single file or a directory of files
    const source = this.normalizePath(options.SOURCE_FILEPATH);
    if (fs.lstatSync(source).isDirectory()) {
      this.directory = source;
      this.filenames = fs.readdirSync(source);
    } else if (fs.lstatSync(source).isFile()) {
      this.directory = path.parse(source).dir;
      this.filenames = [path.parse(source).base];
    } else {
      throw new Error('Invalid sourcefilepath param');
    }
  }
}

module.exports = Base;
