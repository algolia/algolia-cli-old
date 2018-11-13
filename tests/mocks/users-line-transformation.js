// Place every object on it's own line
module.exports = line => {
  if (line === ',') return '';
  else if (line === '[') return line;
  else if (line === ']') return `\n${line}`;
  return line.split('{"gender":"').join('\n{"gender":"');
};
