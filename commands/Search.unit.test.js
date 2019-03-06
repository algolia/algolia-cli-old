const searchScript = require(`./Search.js`);
const algolia = require('algoliasearch');
const path = require('path');
const fs = require('fs');

jest.mock('algoliasearch');
jest.mock('fs');

// Mock fs
const isDirectory = jest.fn().mockReturnValue(true);
fs.writeFileSync = jest.fn();
fs.lstatSync = jest.fn().mockReturnValue({ isDirectory });

// Mock Algolia
const message = 'Caught exception';
const search = jest.fn();
const index = { search };
const client = {
  initIndex: jest.fn().mockReturnValue(index),
};
algolia.mockReturnValue(client);

// Mock user input
const validProgram = {
  algoliaappid: 'fake-command-input-1',
  algoliaapikey: 'fake-command-input-2',
  algoliaindexname: 'fake-command-input-3',
};

const query = 'a';
const params = '{"hitsPerPage": 1}';
const outputpath = path.resolve(process.cwd(), '/tests/mocks/results.json');

describe('Search script OK', () => {
  /* start */

  test('Search should be called with default params', done => {
    // Execute search
    searchScript.start(validProgram);

    expect(algolia).toHaveBeenCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey
    );
    expect(client.initIndex).toHaveBeenCalledWith(
      validProgram.algoliaindexname
    );
    expect(index.search).toHaveBeenCalledWith('', expect.any(Object));
    done();
  });

  test('Search should be called with valid params', async done => {
    // Mock params
    const mockProgram = Object.assign(
      { query, params, outputpath },
      validProgram
    );
    const mockResponse = {
      hits: [{ objectID: 54635 }],
    };
    index.search.mockResolvedValueOnce(mockResponse);

    // Execute search
    await searchScript.start(mockProgram);

    expect(index.search).toHaveBeenCalledWith(query, JSON.parse(params));
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      outputpath,
      JSON.stringify(mockResponse)
    );
    done();
  });

  test('Search catches exceptions', async done => {
    try {
      // Mock error during execution
      client.initIndex.mockImplementation(() => {
        throw new Error(message);
      });
      // Execute method
      await searchScript.start(validProgram);
      throw new Error('This error should not be reached');
    } catch (e) {
      expect(e.message).toEqual(message);
      done();
    }
  });
});
