#!/usr/bin/env node

const program = require('commander');
const { version } = require('./package.json');
const chalk = require('chalk');

const runner = require('./Runner.js');
runner.requireScripts();

// DOCS

const examples = `
Examples:

  $ algolia --help
  $ algolia --version
  $ algolia search -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -q 'example query' -p '{"filters":["category:book"]}' -o ~/Desktop/results.json
  $ algolia import -s ~/Desktop/example_data.json -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -b 5000 -t ~/Desktop/example_transformations.js -m 4 -p '{"delimiter":[":"]}'
  $ algolia export -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -o ~/Desktop/output_folder/ -p '{"filters":["category:book"]}'
  $ algolia getsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME
  $ algolia setsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -s ~/Desktop/example_settings.js -p '{"forwardToReplicas":true}'
  $ algolia addrules -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -s ~/Desktop/example_rules.json
  $ algolia addsynonyms -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -s ~/Desktop/example_synonyms.csv
  $ algolia exportrules -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -o ~/Desktop/output_file.json
  $ algolia exportsynonyms -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -o ~/Desktop/output_file.json
  $ algolia transferindex -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY -i EXAMPLE_DESTINATION_INDEX_NAME -t ~/Desktop/example_transformations.js
  $ algolia transferindexconfig -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY -i EXAMPLE_DESTINATION_INDEX_NAME -p '{"batchSynonymsParams":{"forwardToReplicas":true}}'
  $ algolia deleteindicespattern -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -r '^regex' -x true
  $ algolia transformlines -s ~/Desktop/example_source.json -o ~/Desktop/example_output.json -t ~/Desktop/example_transformations.js
  $ algolia examples
`;

// HELPERS

const registerDefaultProcessEventListeners = () => {
  // Handle process cancellation
  process.on('SIGINT', () => {
    process.exitCode = 2;
    console.log(chalk.white.bgYellow('\nCancelled'));
  });
  // Handle uncaught exceptions
  process.on('uncaughtException', e => {
    process.exitCode = 1;
    console.log(chalk.white.bgRed('\nUncaught Exception:', e));
  });
};

const defaultCommand = command => {
  console.error(`Unknown command "${command}".`);
  console.error('Run "algolia --help" to view options.');
  process.exit(1);
};

// COMMANDS

program.version(version, '-v, --version');

// Search
program
  .command('search')
  .alias('s')
  .description('Search an Algolia index')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option('-q, --query <query>', 'Optional | Algolia search query string')
  .option('-p, --params <params>', 'Optional | Algolia search params')
  .option('-o, --outputpath <outputPath>', 'Optional | Output filepath')
  .action(cmd => {
    runner.scripts.search.start(cmd);
  });

// Import
program
  .command('import')
  .alias('i')
  .description('Import local JSON or CSV data to an Algolia index')
  .option('-s, --sourcefilepath <sourceFilepath>', 'Required | Source filepath')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option(
    '-b, --batchsize <batchSize>',
    'Optional | Number of objects to import per batch'
  )
  .option(
    '-t, --transformationfilepath <transformationFilepath>',
    'Optional | Transformation filepath'
  )
  .option(
    '-m, --maxconcurrency <maxConcurrency>',
    'Optional | Maximum number of concurrent filestreams to process'
  )
  .option('-p, --params <params>', 'Optional | CsvToJson params')
  .action(cmd => {
    runner.scripts.import.start(cmd);
  });

// Export
program
  .command('export')
  .alias('e')
  .description('Export the contents of an Algolia index to local JSON files')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option('-o, --outputpath <outputPath>', 'Optional | Output filepath')
  .option('-p, --params <params>', 'Optional | Algolia browseAll params')
  .action(cmd => {
    runner.scripts.export.start(cmd);
  });

// Get Settings
program
  .command('getsettings')
  .alias('gs')
  .description('Get the settings of an Algolia index as JSON')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .action(cmd => {
    runner.scripts.getsettings.start(cmd);
  });

// Set Settings
program
  .command('setsettings')
  .alias('ss')
  .description('Set the settings of an Algolia index from a JSON file')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option('-s, --sourcefilepath <sourceFilepath>', 'Required | Source filepath')
  .option('-p, --params <params>', 'Optional | Algolia setSettings params')
  .action(cmd => {
    runner.scripts.setsettings.start(cmd);
  });

// Add Rules
program
  .command('addrules')
  .alias('er')
  .description('Add query rules to an Algolia index from a JSON file')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option('-s, --sourcefilepath <sourceFilepath>', 'Required | Source filepath')
  .option('-p, --params <params>', 'Optional | Algolia batchRules params')
  .action(cmd => {
    runner.scripts.addrules.start(cmd);
  });

// Add Synonyms
program
  .command('addsynonyms')
  .alias('as')
  .description('Add synonyms to an Algolia index from a CSV or JSON file')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option('-s, --sourcefilepath <sourceFilepath>', 'Required | Source filepath')
  .option('-p, --params <params>', 'Optional | Algolia batchSynonyms params')
  .action(cmd => {
    runner.scripts.addsynonyms.start(cmd);
  });

// Export Rules
program
  .command('exportrules')
  .alias('er')
  .description('Export the query rules of an Algolia index to local JSON file')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option('-o, --outputpath <outputPath>', 'Optional | Output filepath')
  .action(cmd => {
    runner.scripts.exportrules.start(cmd);
  });

// Export Synonyms
program
  .command('exportsynonyms')
  .alias('es')
  .description('Export the synonyms of an Algolia index to local JSON file')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option('-o, --outputpath <outputPath>', 'Optional | Output filepath')
  .action(cmd => {
    runner.scripts.exportsynonyms.start(cmd);
  });

// Transfer Index
program
  .command('transferindex')
  .alias('ti')
  .description(
    'Duplicate the data and settings of an index from one Algolia App to another'
  )
  .option(
    '-a, --sourcealgoliaappid <algoliaAppId>',
    'Required | Algolia app ID'
  )
  .option(
    '-k, --sourcealgoliaapikey <algoliaApiKey>',
    'Required | Algolia API key'
  )
  .option(
    '-n, --sourcealgoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option(
    '-d, --destinationalgoliaappid <algoliaAppId>',
    'Required | Algolia app ID'
  )
  .option(
    '-y, --destinationalgoliaapikey <algoliaApiKey>',
    'Required | Algolia API key'
  )
  .option(
    '-i, --destinationindexname <algoliaIndexName>',
    'Optional | Algolia index name'
  )
  .option(
    '-t, --transformationfilepath <transformationFilepath>',
    'Optional | Transformation filepath'
  )
  .action(cmd => {
    runner.scripts.transferindex.start(cmd);
  });

// Transfer Index Config
program
  .command('transferindexconfig')
  .alias('tig')
  .description(
    'Duplicate the settings, synonyms, and query rules of an index from one Algolia App to another'
  )
  .option(
    '-a, --sourcealgoliaappid <algoliaAppId>',
    'Required | Algolia app ID'
  )
  .option(
    '-k, --sourcealgoliaapikey <algoliaApiKey>',
    'Required | Algolia API key'
  )
  .option(
    '-n, --sourcealgoliaindexname <algoliaIndexName>',
    'Required | Algolia index name'
  )
  .option(
    '-d, --destinationalgoliaappid <algoliaAppId>',
    'Required | Algolia app ID'
  )
  .option(
    '-y, --destinationalgoliaapikey <algoliaApiKey>',
    'Required | Algolia API key'
  )
  .option(
    '-i, --destinationindexname <algoliaIndexName>',
    'Optional | Algolia index name'
  )
  .option(
    '-p, --params <params>',
    'Optional | Algolia batchSynonyms and batchRules params'
  )
  .action(cmd => {
    runner.scripts.transferindexconfig.start(cmd);
  });

// Delete Indices

program
  .command('deleteindicespattern')
  .alias('dip')
  .description('Delete multiple indices using a regular expression')
  .option('-a, --algoliaappid <algoliaAppId>', 'Required | Algolia app ID')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Required | Algolia API key')
  .option('-r, --regexp <regexp>', 'Required | Regexp to use for filtering')
  .option(
    '-x, --dryrun <boolean>',
    'Required | Dry run, will only output what would be done'
  )
  .action(cmd => {
    runner.scripts.deleteindicespattern.start(cmd);
  });

// Transform Lines
program
  .command('transformlines')
  .alias('tl')
  .description(
    'Apply a custom transformation to each line of a file saving output lines to a new file'
  )
  .option('-s, --sourcefilepath <sourceFilepath>', 'Required | Source filepath')
  .option('-o, --outputpath <outputPath>', 'Optional | Output filepath')
  .option(
    '-t, --transformationfilepath <transformationFilepath>',
    'Optional | Transformation filepath'
  )
  .action(cmd => {
    runner.scripts.transformlines.start(cmd);
  });

// Display command examples
program
  .command('examples')
  .alias('ex')
  .description('View command examples')
  .action(() => {
    console.log(examples);
  });

// Interactive command
program
  .command('interactive')
  .alias('shell')
  .description('Run in an interactive mode')
  .action(cmd => {
    console.log(Object.keys(runner.scripts));
    runner.scripts.interactive.start(cmd)
  })

// Default Command
program
  .command('*')
  .alias('default')
  .description('Default command if none input')
  .action(cmd => {
    defaultCommand(cmd);
  });

// LOGIC

// Process command
program.parse(process.argv);
// Register node process event listeners
registerDefaultProcessEventListeners();
// Handle no-command case
if (program.args.length === 0) program.help();
