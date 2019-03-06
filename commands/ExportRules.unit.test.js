const exportRulesScript = require(`./ExportRules.js`);
const algolia = require('algoliasearch');
const path = require('path');
const fs = require('fs');

jest.mock('algoliasearch');
jest.mock('fs');

// Mock fs
const isDirectory = jest.fn().mockReturnValue(true);
fs.lstatSync.mockReturnValue({ isDirectory });
fs.writeFileSync = jest.fn();

// Mock Algolia
const message = 'Caught exception';
const fakeRules = [
  {
    condition: { pattern: 'foo', anchoring: 'contains' },
    consequence: { userData: { foo: 'bar' } },
    description: 'Test',
    objectID: '1550287012823',
  },
];
const exportRules = jest.fn().mockResolvedValueOnce(fakeRules);
const index = { exportRules };
const client = {
  initIndex: jest.fn(),
};
algolia.mockReturnValue(client);

// Mock user input
const validProgram = {
  algoliaappid: 'fake-command-input-1',
  algoliaapikey: 'fake-command-input-2',
  algoliaindexname: 'fake-command-input-3',
  outputpath: null,
};

describe('ExportRules script OK', () => {
  /* start */

  test('exportRules and writeFileSync should be called', async done => {
    const filepath = path.resolve(
      process.cwd(),
      `${validProgram.algoliaindexname}-rules.json`
    );
    client.initIndex.mockReturnValueOnce(index);
    await exportRulesScript.start(validProgram);
    expect(algolia).toHaveBeenCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey
    );
    expect(client.initIndex).toHaveBeenCalledWith(
      validProgram.algoliaindexname
    );
    expect(index.exportRules).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(filepath, expect.any(String));
    done();
  });

  test('exportRules catches exceptions', async done => {
    try {
      // Mock error during execution
      client.initIndex.mockImplementation(() => {
        throw new Error(message);
      });
      // Execute method
      await exportRulesScript.start(validProgram);
      throw new Error('This error should not be reached');
    } catch (e) {
      expect(e.message).toEqual(message);
      done();
    }
  });
});
