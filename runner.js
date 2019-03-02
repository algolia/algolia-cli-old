const fs = require('fs');

class Runner {
  requireScripts() {
    const paths = fs
      .readdirSync('./scripts')
      .filter(path => !path.includes('unit'));
    this.scripts = {};

    paths.forEach(path => {
      this.scripts[
        path.split('.')[0].toLowerCase()
      ] = require(`./scripts/${path}`);
    });
  }
}

module.exports = new Runner();
