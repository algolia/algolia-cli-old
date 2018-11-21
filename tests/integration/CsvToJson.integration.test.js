const fs = require('fs');
const csvToJsonScript = require(`${__dirname}/../../scripts/CsvToJson.js`);

const tempDir = `${__dirname}/../temp`;
const mocksDir = `${__dirname}/../mocks`;
const filename = 'orders.csv';
const transformedFilename = 'orders.json';
const ordersData = `${mocksDir}/${filename}`;
const transformedOrdersData = `${tempDir}/${transformedFilename}`;

const program = {
  sourcefilepath: ordersData,
  outputfilepath: transformedOrdersData,
  rawArgs: [
    'node',
    'index.js',
    'csvtojson',
    '-s',
    ordersData,
    '-o',
    transformedOrdersData,
  ],
};

const countLines = filePath =>
  // Count newlines by checking buffer for it's ASCII charCode (10)
  new Promise((resolve, reject) => {
    let i;
    let count = 0;
    require('fs')
      .createReadStream(filePath)
      .on('data', chunk => {
        /* eslint-disable-next-line eqeqeq */
        for (i = 0; i < chunk.length; ++i) if (chunk[i] == 10) count++;
      })
      .on('end', () => {
        resolve(count);
      })
      .on('error', reject);
  });

describe('CsvToJson command OK', () => {
  beforeAll(() => {
    // Make temp dir for test output
    if (fs.existsSync(tempDir)) {
      if (fs.existsSync(transformedOrdersData))
        fs.unlinkSync(transformedOrdersData);
      fs.rmdirSync(tempDir);
    }
    fs.mkdirSync(tempDir);
  });

  test('Convert orders file from CSV to JSON', done => {
    csvToJsonScript.start(program);
    setTimeout(async () => {
      const exists = fs.existsSync(transformedOrdersData);
      const isFile = fs.lstatSync(transformedOrdersData).isFile();
      const lines = await countLines(transformedOrdersData);
      const file = fs.readFileSync(transformedOrdersData);
      const parsedFile = JSON.parse(file);
      const order = parsedFile[0];
      const title = order.title;
      const score = order.score;

      expect(exists).toBe(true);
      expect(isFile).toBe(true);
      expect(lines).toBe(6);
      expect(title).toBe('meow');
      expect(score).toBe('115');
      done();
    }, 1000);
  });

  afterAll(() => {
    // Remove temp dir for test output
    if (fs.existsSync(tempDir)) {
      if (fs.existsSync(transformedOrdersData))
        fs.unlinkSync(transformedOrdersData);
      fs.rmdirSync(tempDir);
    }
  });
});
