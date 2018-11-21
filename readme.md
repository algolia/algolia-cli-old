# Algolia CLI

A Node CLI tool that makes it easy to perform common data manipulations and interactions with your Algolia app or indices.

- [Requirements](#requirements)
- [Install](#install)
- [Usage](#usage)
- [Commands](#commands)
- [Examples](#examples)
- [Contribute](#contribute)

# Requirements

- [Node.js](https://nodejs.org/) - tested on versions `8.9.1` and `10.10.0`

# Install

- `npm install -g @algolia/cli`

# Usage

##### 📌 `algolia <COMMAND NAME> [OPTIONS]` 📌


```bash
$ algolia --help

$ algolia --version

$ algolia import -s <sourceFilepath> -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -b <batchSize> -t <transformationFilepath> -m <maxconcurrency>

$ algolia export -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputFilepath> -p <params>

$ algolia transformlines -s <sourceFilepath> -o <outputFilepath> -t <transformationFilepath>

$ algolia csvtojson -s <sourceFilepath> -o <outputFilepath> <options>

$ algolia getsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName>

$ algolia setsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath>

$ algolia transferindex -a <sourcealgoliaAppId> -k <sourcealgoliaApiKey> -n <sourcealgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey> -t <transformationFilepath>

$ algolia transferindexconfig -a <sourcealgoliaAppId> -k <sourcealgoliaApiKey> -n <sourcealgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey>
```

See also [additional examples](#examples).

# Commands

### 1. Help | `--help`

##### Description:

Get basic usage info for all provided CLI scripts.

##### Usage:

```shell
algolia --help
```

or

```
algolia -h
```

### 2. Version | `--version`

##### Description:

Get version info for npm package.

##### Usage:

```shell
algolia --version
```

or

```
algolia -v
```

### 3. Import | `import`

##### Description:

Import JSON or CSV data into Algolia index, from a file or directory of files. CSV files will automatically be converted to JSON. You may also optionally apply transformations to each JSON object.

Will handle arbitrarily large files without performance issues.

##### Usage:

```shell
algolia import -s <sourceFilepath> -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -b <batchSize> -t <transformationFilepath> -m <maxconcurrency>
```

##### Options:

- `<sourceFilepath>` | Required | Path to a JSON or CSV file, or to a directory of such files.
- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<batchSize>` | Optional | Number of JSON objects to be included in each batch for indexing. Default is `5000`.
- `<transformationFilepath>` | Optional | The path to any file that exports a function which (1) takes 2 arguments; an object and a callback, then (2) ends by calling said callback with the 2 arguments `null` and `<YOUR_TRANSFORMED_OBJECT>`.
- `<maxconcurrency>` | Optional | Maximum number of concurrent filestreams to process. Default is `2`.

##### Example Transformation File:

See `transformations/example-transformations.js` for an extensive JSON object transformation example.

Simple transformation file example:
```javascript
module.exports = (data,cb) => {
  let record = data;
  record.objectID = data.product_id;
  record.proper_number = parseInt(data.integer_formatted_as_string,10);
  cb( null, record );
}
```

##### Notes:

- `<sourceFilepath>` and `<transformationFilepath>` arguments can be absolute or relative paths.
- If your system has limited memory resources or if you run into heap allocation errors, consider reducing `<maxconcurrency>`.
- Make sure you only import JSON or CSV files. Don't accidentally try to import invisible files like `.DS_Store`, log files, etc. as they will likely throw an error.
- Script assumes each file contains an array of JSON records unless the file extension ends with `.csv`.
- CSV to JSON conversion performed using [csvtojson](https://www.npmjs.com/package/csvtojson).

### 4. Export | `export`

##### Description:

Download all JSON records from a specific Algolia index.

##### Usage:

```shell
algolia export -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputFilepath> -p <params>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<outputFilepath>` | Required | Must be an existing local directory.
- `<params>` | Optional | [Search params](https://www.algolia.com/doc/api-reference/search-api-parameters/) to be sent with `browseAll()` query to Algolia.

### 5. Transform Lines | `transformlines`

##### Description:

Transform a file line-by-line.

##### Usage:

```shell
algolia transformlines -s <sourceFilepath> -o <outputFilepath> -t <transformationFilepath>
```

##### Options:

- `<sourceFilepath>` | Required | Path to a single `.js` or `.json` file OR a directory of such files.
- `<outputFilepath>` | Required | Path to directory where output files will be saved (saved output filenames will match corresponding source filenames). Must be an existing local directory.
- `<transformationFilepath>` | Optional | Path to file that exports a function which (1) takes a line string, and (2) returns a transformed line string.

##### Example use case:

Mapping each line of input file to a new output file.

Originally designed for converting `.json-seq` files to regular comma separated JSON arrays, in order to index them with the `import` cli tool.

##### Example Transformation File:

Let's say we had this source JSON file:
```json
[
  {"id":1,"color":"blue"},
  {"id":2,"color":"red"},
  {"id":3,"color":"green"}
]
```
and we wanted to filter out any objects that didn't have a "color" value of "blue". In this case, our transformations function could be something like this:
```javascript
module.exports = (line) => {
  if (line === '[' || line === ']') {
    return line;
  } else if (line.includes('"color":"blue"')) {
    return line;
  } else {
    return '\n';
  }
}
```

##### Notes:

- `<sourceFilepath>`, `<outputFilepath>`, and `<transformationFilepath>` arguments should be absolute paths.
- `<outputFilepath>` MUST be a directory.
- Running the `transform_lines` command without providing optional `<transformationFilepath>` param will cause it to assume it's parsing a `.json-seq` file; thus, it will apply the `defaultLineTransformation` method in `transformLines.js` to each line. This checks each line for the ASCII Record Separator character `\u001e` and replaces it with a `,`. It will _also_ cause it to enclose the whole file in "[" and "]" square brackets to make it a valid JS array. Providing a custom transformation method via the optional `<transformationFilepath>` param will make it exclusively run your transformation function instead of the default one (and in this case it will also omit adding enclosing square brackets).

### 6. CSV to JSON | `csvtojson`

##### Description:

Convert CSV file to JSON file.

##### Usage:

```shell
algolia csvtojson -s <sourceFilepath> -o <outputFilepath> <options>
```

##### Options:

- `<sourceFilepath>` | Required | Path to a single `.csv` source file.
- `<outputFilepath>` | Required | Path to output file that will be saved (including filename and extension).
- `<options>` | Optional | Any additional options to be passed to [csvtojson](https://www.npmjs.com/package/csvtojson) module. Declare optional params without flag.

##### Notes:

- `<sourceFilepath>` and `<outputFilepath>` arguments should be absolute paths.
- Uses the `csvtojson` npm module. Read more documentation in the [csvtojson Github repo](https://github.com/Keyang/node-csvtojson) to see available options.

### 7. Get Settings | `getsettings`

##### Description:

Get settings for a specific Algolia index.

##### Usage:

```shell
algolia getsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required

### 8. Set Settings | `setsettings`

##### Description:

Set settings for a specific Algolia index.

##### Usage:

```shell
algolia setsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath>
```

##### Options:

- `<algoliaAppId>` | Required
- `<algoliaApiKey>` | Required
- `<algoliaIndexName>` | Required
- `<sourceFilepath>` | Required | Path to a single `.js` settings file that exports a settings object.

##### Example settings file:

```js
module.exports = {
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8,
  hitsPerPage: 20,
  maxValuesPerFacet: 100,
  version: 2,
  attributesToIndex: null,
  numericAttributesToIndex: null,
  attributesToRetrieve: null,
  unretrievableAttributes: null,
  optionalWords: null,
  attributesForFaceting: null,
  attributesToSnippet: null,
  attributesToHighlight: null,
  paginationLimitedTo: 1000,
  attributeForDistinct: null,
  exactOnSingleWordQuery: 'attribute',
  ranking:
   [ 'typo',
     'geo',
     'words',
     'filters',
     'proximity',
     'attribute',
     'exact',
     'custom' ],
  customRanking: null,
  separatorsToIndex: '',
  removeWordsIfNoResults: 'none',
  queryType: 'prefixLast',
  highlightPreTag: '<em>',
  highlightPostTag: '</em>',
  snippetEllipsisText: '',
  alternativesAsExact: [ 'ignorePlurals', 'singleWordSynonym' ]
};
```

### 9. Transfer Index | `transferindex`

##### Description:

Transfer all data and settings (including synonyms and query rules) from one Algolia app/index to another.

##### Usage:

```shell
algolia transferindex -a <sourceAlgoliaAppId> -k <sourceAlgoliaApiKey> -n <sourceAlgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey>
```

##### Options:

- `<sourceAlgoliaAppId>` | Required
- `<sourceAlgoliaApiKey>` | Required
- `<sourceAlgoliaIndexName>` | Required
- `<destinationAlgoliaAppId>` | Required
- `<destinationAlgoliaApiKey>` | Required
- `<transformationFilepath>` | Optional | The path to any file that exports a function which (1) takes a single object as argument, then (2) returns a transformed object.

##### Notes:

- When transferring synonyms and query rules: `forwardToReplicas`, `replaceExistingSynonyms`, and `clearExistingRules` params will be set to true.

### 10. Transfer Index Config | `transferindexconfig`

##### Description:

Transfer an index's settings, synonyms, and query rules to another index. Works even across indices in different Algolia applications.

##### Usage:

```shell
algolia transferindexconfig -a <sourceAlgoliaAppId> -k <sourceAlgoliaApiKey> -n <sourceAlgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey>
```

##### Options:

- `<sourceAlgoliaAppId>` | Required
- `<sourceAlgoliaApiKey>` | Required
- `<sourceAlgoliaIndexName>` | Required
- `<destinationAlgoliaAppId>` | Required
- `<destinationAlgoliaApiKey>` | Required

##### Notes:

- When transferring synonyms and query rules: `forwardToReplicas`, `replaceExistingSynonyms`, and `clearExistingRules` params will be set to true.

# Examples
```bash
$ algolia --help

$ algolia --version

$ algolia import -s ~/Desktop/example_source_directory/ -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -b 5000 -t ~/Desktop/example_transformations.js -m 4

$ algolia export -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -o ~/Desktop/example_output_folder/ -p ~/Desktop/example_params.js

$ algolia transformlines -s ~/Desktop/example_source_file.json -o ~/Desktop/example_output_folder/ -t ~/Desktop/example_transformations.js

$ algolia csvtojson -s ~/Desktop/example_source_file.json -o ~/Desktop/example_output_file.json --delimiter=,

$ algolia getsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME

$ algolia setsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -s ~/Desktop/example_settings.js

$ algolia transferindex -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY -t ~/Desktop/example_transformations.js

$ algolia transferindexconfig -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY
```

# Contribute

## Requirements

- Node: `brew install node` or [Node docs](https://nodejs.org/en/)
- Yarn: `brew install yarn` or [Yarn docs](https://yarnpkg.com/lang/en/)

## Install

- Clone repo.
- `yarn install`
- Create `.env` file in project root and assign environment variables as listed [below](#environment-variables).

## Environment variables

- `ALGOLIA_TEST_APP_ID`
- `ALGOLIA_TEST_API_KEY`
- `ALGOLIA_TEST_INDEX_NAME`
- `ALGOLIA_TEST_ALT_APP_ID`
- `ALGOLIA_TEST_ALT_API_KEY`

## Develop
- Run `node index.js <command_name> [options]` to test various commands/options.
- Write code!
- Please use [git-flow](https://github.com/nvie/gitflow) and commit your changes on a feature branch, rebase it on develop branch before finishing the feature, then issue pull request to develop branch

## Tests
- `yarn test` to run full test suite locally
- `yarn test:unit` to run unit test suite only
- `yarn test:unit:watch` to run unit test suite with interactive `--watch` flag

## Lint
- `yarn lint` to run eslint
- `yarn lint:fix` to run eslint with --fix flag

