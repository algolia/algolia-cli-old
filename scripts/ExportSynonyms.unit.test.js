const exportSynonymsScript = require(`./ExportSynonyms.js`);
const HttpsAgent = require('agentkeepalive');
const algolia = require('algoliasearch');
const path = require('path');
const fs = require('fs');

jest.mock('agentkeepalive');
jest.mock('algoliasearch');
jest.mock('fs');

// Mock Keepalive
HttpsAgent.HttpsAgent = jest.fn();

// Mock fs
const isDirectory = jest.fn().mockReturnValue(true);
fs.lstatSync.mockReturnValue({ isDirectory });
fs.writeFileSync = jest.fn();

// Mock Algolia
const message = 'Caught exception';
const fakeSynonyms = [
  {
    type: 'altCorrection1',
    word: 'smartphone',
    corrections: ['iphone'],
    objectID: 'smartphone-syn',
  },
];
const exportSynonyms = jest.fn().mockResolvedValueOnce(fakeSynonyms);
const index = { exportSynonyms };
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

describe('ExportRules synonyms OK', () => {
  /* start */

  test('exportSynonyms and writeFileSync should be called', async done => {
    const filepath = path.resolve(
      process.cwd(),
      `${validProgram.algoliaindexname}-synonyms.json`
    );
    client.initIndex.mockReturnValueOnce(index);
    await exportSynonymsScript.start(validProgram);
    expect(algolia).toHaveBeenCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey,
      expect.any(Object)
    );
    expect(client.initIndex).toHaveBeenCalledWith(
      validProgram.algoliaindexname
    );
    expect(index.exportSynonyms).toHaveBeenCalled();
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
      await exportSynonymsScript.start(validProgram);
      throw new Error('This error should not be reached');
    } catch (e) {
      expect(e.message).toEqual(message);
      done();
    }
  });
});
