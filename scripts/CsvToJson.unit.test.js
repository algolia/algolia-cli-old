const csvToJsonScript = require(`./CsvToJson.js`);
const childProcess = require('child_process');

jest.mock('child_process');

// Mock user input
const validProgram = {
  sourcefilepath: 'fake-command-input-1',
  outputfilepath: 'fake-command-input-2',
};

describe('CsvToJson script OK', () => {
  /* start */

  test('Child process should be called with valid params', done => {
    const execSpy = jest.spyOn(childProcess, 'exec');
    csvToJsonScript.start(validProgram);
    expect(execSpy).toBeCalledWith(
      `./node_modules/csvtojson/bin/csvtojson ${
        validProgram.sourcefilepath
      } > ${validProgram.outputfilepath}`,
      expect.any(Function)
    );
    done();
  });
});
