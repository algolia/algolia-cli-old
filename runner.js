const fs = require('fs');
const path = require('path');

class Runner {
  requireScripts() {
    const paths = fs
      .readdirSync('./scripts')
      .filter(filepath => !filepath.includes('unit'));
    this.scripts = {};

    paths.forEach(filepath => {
      this.scripts[
        path.basename(filepath).toLowerCase()
      ] = require(`./scripts/${path}`);
    });
  }
}

module.exports = new Runner();
