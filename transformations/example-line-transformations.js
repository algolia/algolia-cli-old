// Example transformation function to be passed to TransformLines script.

/*

In the contrived example below, we want to transform a hypothetical json file with the following criteria:

  - We'll assume that our file contains exactly one JSON record per line.
  - We'll also assume that the first line of our file is the opening square brace for a JSON array
  - We'll also assume that the last line of our file is the closing square brace for the JSON array
  - Our goal is to write a new file that contains a filtered JSON array for indexing in Algolia
  - We want our filter to remove any records that have a facet value of "inactive" in the "status" attribute

*/

module.exports = line => {
  if (line === '[') {
    // First line is an opening brace; return it intact
    return line;
  } else if (line === ']') {
    // Last line is an opening brace; return it intact
    return line;
  } else if (line.includes('"status":"active"')) {
    // Preserve that contain valid record
    return line;
  } else {
    // Remove all other lines
    return '\n';
  }
};
