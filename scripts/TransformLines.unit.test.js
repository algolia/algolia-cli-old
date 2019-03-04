const transformLinesScript = require(`./TransformLines.js`);
const EventEmitter = require('events');
const readLine = require('readline');
const path = require('path');
const fs = require('fs');

jest.mock('readline');
jest.mock('fs');

// Require transformation file
const transformationFilepath = path.resolve(
  process.cwd(),
  'tests/mocks/users-line-transformation.js'
);
const transformation = require(transformationFilepath);

// Mock fs
const isDirectory = () => true;
fs.lstatSync = jest.fn().mockReturnValue({ isDirectory });

// Mock user input
const validProgram = {
  sourcefilepath: 'fake-command-input-1',
  outputpath: 'fake-command-input-2',
};

describe('TransformLines script OK', () => {
  /* defaultLineTransformation */

  test('defaultLineTransformation does not affect regular JSON', done => {
    const data = JSON.stringify({
      name: 'fake-hit-1',
      objectID: 'fake-object-098765',
      number: 10987657,
    });
    const result = transformLinesScript.defaultLineTransformation(data);
    expect(result).toEqual(data);
    done();
  });

  /* setOutput */

  test('Should remove trailing "/" and set outputDir', done => {
    const outputPath = 'test/output/file/path.js';
    transformLinesScript.setOutput(`${outputPath}/`);
    expect(transformLinesScript.outputDir.includes(outputPath)).toBe(true);
    done();
  });

  /* setTransformations */

  test('Should set provided line transformation', done => {
    transformLinesScript.setTransformations(transformationFilepath);
    expect(transformLinesScript.lineTransformation).toEqual(transformation);
    done();
  });

  test('Should use default line transformation if none provided', done => {
    transformLinesScript.setTransformations(null);
    expect(transformLinesScript.lineTransformation).toEqual(
      transformLinesScript.defaultLineTransformation
    );
    done();
  });

  /* transformFile */

  test('Should be called with valid params', done => {
    // Mock input params
    const directory = 'tests/mocks/input/';
    const outputDir = 'tests/mocks/output/';
    const filename = 'test.js';
    // Mock write stream
    const writeStream = {
      write: jest.fn(),
      end: jest.fn(),
    };
    fs.createWriteStream = jest.fn().mockReturnValue(writeStream);
    fs.createReadStream = jest.fn(x => x);
    // Mock read stream
    const lineReader = new EventEmitter();
    readLine.createInterface = jest.fn().mockReturnValueOnce(lineReader);
    // Configure instance variables
    transformLinesScript.outputDir = outputDir;
    transformLinesScript.directory = directory;
    transformLinesScript.transformationFilepath = 'not-null';
    // Execute method
    transformLinesScript.transformFile(filename);
    expect(fs.createWriteStream).toHaveBeenCalledWith(
      `${outputDir}/${filename}`
    );
    expect(fs.createReadStream).toHaveBeenCalled();
    expect(readLine.createInterface).toHaveBeenCalledWith({
      input: `${directory}/${filename}`,
    });
    done();
  });

  test('Should respond to onLine and onClose events', done => {
    // Spy
    const logSpy = jest.spyOn(global.console, 'log');
    // Mock input params
    const mockedLine = 'mocked-line';
    const directory = 'tests/mocks/input/';
    const outputDir = 'tests/mocks/output/';
    const filename = 'test.js';
    // Mock write stream
    const writeStream = {
      write: jest.fn(),
      end: jest.fn(),
    };
    fs.createWriteStream = jest.fn().mockReturnValue(writeStream);
    fs.createReadStream = jest.fn(x => x);
    // Mock read stream
    const lineReader = new EventEmitter();
    readLine.createInterface = jest.fn().mockReturnValueOnce(lineReader);
    // Configure instance variables
    transformLinesScript.outputDir = outputDir;
    transformLinesScript.directory = directory;
    transformLinesScript.transformationFilepath = null;
    transformLinesScript.lineTransformation = jest.fn(x => `${x}-t`);
    // Execute method
    transformLinesScript.transformFile(filename);
    // Test onLine event handler
    lineReader.emit('line', mockedLine);
    // Test onClose event handler
    lineReader.emit('close');
    // Expect script to apply given transformation to each line
    expect(transformLinesScript.lineTransformation).toHaveBeenCalledWith(
      mockedLine
    );
    // Expect insertion of enclosing array brackets when no transformation filepath provided
    expect(writeStream.write).toHaveBeenCalledTimes(3);
    expect(writeStream.write).toHaveBeenNthCalledWith(1, '[');
    expect(writeStream.write).toHaveBeenNthCalledWith(2, `${mockedLine}-t`);
    expect(writeStream.write).toHaveBeenNthCalledWith(3, ']');
    // Expect script to execute logic in onClose event handler
    expect(logSpy).toHaveBeenCalledWith('Done writing!');
    expect(writeStream.end).toHaveBeenCalled();
    done();
  });

  test('Should catch unexpected exception', async done => {
    // Mock unexpected exception
    const message = 'Caught exception.';
    fs.createWriteStream.mockImplementation(() => {
      throw new Error(message);
    });
    // Mock read stream
    const lineReader = new EventEmitter();
    readLine.createInterface = jest.fn().mockReturnValueOnce(lineReader);
    // Execute method
    try {
      setTimeout(() => lineReader.emit('close'), 1000);
      await transformLinesScript.transformFile('test.js');
    } catch (e) {
      expect(e).toEqual(new Error(message));
      done();
    }
  });

  /* init */

  test('init method should call transformFile with correct params', async done => {
    const filenames = ['test.js', 'test-2.js'];
    transformLinesScript.transformFile = jest.fn();
    await transformLinesScript.init(filenames);
    expect(transformLinesScript.transformFile).toHaveBeenCalledTimes(2);
    expect(transformLinesScript.transformFile).toHaveBeenNthCalledWith(
      1,
      'test.js'
    );
    expect(transformLinesScript.transformFile).toHaveBeenNthCalledWith(
      2,
      'test-2.js'
    );
    done();
  });

  /* start */

  test('Should kick off script when called with valid params', done => {
    // Mock all instance variables and methods
    const filename = 'test.js';
    transformLinesScript.filenames = [filename];
    transformLinesScript.setSource = jest.fn();
    transformLinesScript.init = jest.fn();
    transformLinesScript.start(validProgram);
    expect(transformLinesScript.init).toHaveBeenCalledWith([filename]);
    done();
  });
});
