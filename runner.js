const fs = require('fs');
const path = require('path');

class Runner {
  requireScripts() {
    const paths = fs
      .readdirSync('./scripts')
      .filter(filepath => !filepath.includes('unit'));
    this.scripts = {};

    paths.forEach(filepath => {
      const scriptName = path.basename(filepath, '.js').toLowerCase();
      this.scripts[scriptName] = require(`./scripts/${filepath}`);
    });
  }
}

module.exports = new Runner();
