const csvToJsonScript = require(`./CsvToJson.js`);
const childProcess = require('child_process');
const path = require('path');

const csvToJsonPath = path.join(
  __dirname,
  '../node_modules/csvtojson/bin/csvtojson'
);

const ordersPath = path.join(__dirname, '../tests/mocks/orders.csv');
const outputPath = path.join(__dirname, '../tests/mocks/orders.json');

jest.mock('child_process');

// Mock user inputs
const validProgram = {
  sourcefilepath: ordersPath,
  outputfilepath: outputPath,
  rawArgs: [
    'node',
    'index.js',
    'csvtojson',
    '-s',
    ordersPath,
    '-o',
    outputPath,
  ],
};

const invalidProgram = {
  sourcefilepath: 'fake-command-input-1',
  outputfilepath: 'fake-command-input-2',
  rawArgs: [
    'node',
    'index.js',
    'csvtojson',
    '-s',
    'fake-command-input-1',
    '-o',
    'fake-command-input-2',
  ],
};

describe('CsvToJson script OK', () => {
  /* start */

  test('Child process should not be called with invalid params', done => {
    const consoleLogSpy = jest.spyOn(global.console, 'log');
    const execSpy = jest.spyOn(childProcess, 'exec');
    const errorPhrase = 'Cannot find file or directory';
    csvToJsonScript.start(invalidProgram);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(errorPhrase)
    );
    expect(execSpy).not.toHaveBeenCalled();
    done();
  });

  test('Child process should be called with valid params', done => {
    const execSpy = jest.spyOn(childProcess, 'exec');
    csvToJsonScript.start(validProgram);
    expect(execSpy).toHaveBeenCalledWith(
      `${csvToJsonPath} ${validProgram.sourcefilepath} > ${
        validProgram.outputfilepath
      } `,
      expect.any(Function)
    );
    done();
  });
});
