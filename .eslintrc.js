module.exports = {
    extends: [
      "algolia",
      "algolia/jest",
    ],
    rules: {
      "import/no-commonjs": "off",
      "import/extensions": "ignorePackages",
      "no-console": "off",
      "no-process-exit": "off",
    }
};
