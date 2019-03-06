const Base = require(`./Base.js`);
const baseScript = new Base();
const path = require('path');
const os = require('os');
const fs = require('fs');
const readLine = require('readline');

jest.mock('fs');
jest.mock('readline');

// Mock Readline
readLine.clearLine = jest.fn();
readLine.cursorTo = jest.fn();
process.stdout.write = jest.fn();

// Mock fs
const isDirectory = jest
  .fn()
  .mockReturnValueOnce(false)
  .mockReturnValueOnce(true)
  .mockReturnValueOnce(false);
const isFile = jest.fn().mockReturnValue(true);
fs.lstatSync.mockReturnValue({ isDirectory, isFile });

const message =
  '\nUsage: $ algolia test -x fakeParam1 -y fakeParam2 -z fakeParam3\n\n';
const params = ['fakeParam1', 'fakeParam2'];

// Mock user input
const validProgram = {
  fakeParam1: 'fake-command-input-1',
  fakeParam2: 'fake-command-input-2',
};
const invalidProgram = {
  fakeParam1: 'fake-command-input-1',
  help: jest.fn(),
};

describe('Base script OK', () => {
  /* validate */

  test('Should validate command with required input params', done => {
    const isValid = baseScript.validate(validProgram, message, params);
    expect(isValid.flag).toEqual(false);
    done();
  });

  test('Should reject command missing required input params', done => {
    const result = baseScript.validate(invalidProgram, message, params);
    expect(result).toEqual(undefined);
    expect(invalidProgram.help).toHaveBeenCalled();
    done();
  });

  /* writeProgress */

  test('writeProgress should output string', done => {
    const random = Math.floor(Math.random() * 10);
    const msg = `Message with random number ${random}`;
    baseScript.writeProgress(msg);
    expect(readLine.clearLine).toHaveBeenCalled();
    expect(readLine.cursorTo).toHaveBeenCalled();
    expect(process.stdout.write).toHaveBeenCalledWith(msg);
    done();
  });

  /* normalizePath */

  test('Should normalize various path formats', done => {
    const inputs = [
      `./`,
      `test.js`,
      `./test.js`,
      `scripts/test.js`,
      `./scripts/test.js`,
      `~/Documents/Code/practice/path-manipulation`,
      `~/Documents/Code/practice/path-manipulation/`,
      `~/Documents/Code/practice/path-manipulation/test.js`,
      `/Users/username/Documents/Code/practice/path-manipulation`,
      `/Users/username/Documents/Code/practice/path-manipulation/`,
      `/Users/username/Documents/Code/practice/path-manipulation/test.js`,
    ];
    const result = inputs.map(input => baseScript.normalizePath(input));
    // See inline comments for expected results
    expect(result[0]).toEqual(path.resolve(process.cwd(), inputs[0])); // /Users/sfa/Documents/Code/cse/algolia-cli
    expect(result[1]).toEqual(path.resolve(process.cwd(), inputs[1])); // /Users/sfa/Documents/Code/cse/algolia-cli/test.js
    expect(result[2]).toEqual(path.resolve(process.cwd(), inputs[2])); // /Users/sfa/Documents/Code/cse/algolia-cli/test.js
    expect(result[3]).toEqual(path.resolve(process.cwd(), inputs[3])); // /Users/sfa/Documents/Code/cse/algolia-cli/scripts/test.js
    expect(result[4]).toEqual(path.resolve(process.cwd(), inputs[4])); // /Users/sfa/Documents/Code/cse/algolia-cli/scripts/test.js
    expect(result[5]).toEqual(path.join(os.homedir(), inputs[5].substr(1))); // /Users/sfa/Documents/Code/practice/path-manipulation
    expect(result[6]).toEqual(path.join(os.homedir(), inputs[6].substr(1))); // /Users/sfa/Documents/Code/practice/path-manipulation/
    expect(result[7]).toEqual(path.join(os.homedir(), inputs[7].substr(1))); // /Users/sfa/Documents/Code/practice/path-manipulation/test.js
    expect(result[8]).toEqual(result[8]); // /Users/username/Documents/Code/practice/path-manipulation
    expect(result[9]).toEqual(result[9]); // /Users/username/Documents/Code/practice/path-manipulation/
    expect(result[10]).toEqual(result[10]); // /Users/username/Documents/Code/practice/path-manipulation/test.js
    done();
  });

  /* setSource */

  test('Should set directory and filenames instance variables for file input param', done => {
    const normalizePathSpy = jest.spyOn(baseScript, 'normalizePath');
    const directory =
      '/Users/username/Documents/Code/practice/path-manipulation';
    const filename = 'test.js';
    const filepath = `${directory}/${filename}`;
    const options = {
      sourceFilepath: filepath,
    };
    baseScript.setSource(options);
    expect(normalizePathSpy).toHaveBeenCalledWith(filepath);
    expect(baseScript.directory).toEqual(directory);
    expect(baseScript.filenames).toEqual([filename]);
    done();
  });

  test('Should set directory and filenames instance variables for directory input param', done => {
    const normalizePathSpy = jest.spyOn(baseScript, 'normalizePath');
    const directory =
      '/Users/username/Documents/Code/practice/path-manipulation';
    const filename = 'test.js';
    const options = {
      sourceFilepath: directory,
    };
    fs.readdirSync.mockReturnValueOnce([filename]);
    baseScript.setSource(options);
    expect(normalizePathSpy).toHaveBeenCalledWith(directory);
    expect(baseScript.directory).toEqual(directory);
    expect(baseScript.filenames).toEqual([filename]);
    done();
  });
});
