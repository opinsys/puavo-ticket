"use strict";

module.exports = function(config) {
  config.set({
    frameworks: ["mocha"],
    usePolling: true, // https://github.com/karma-runner/karma/issues/895#issuecomment-37736221
    autoWatch: true,
    files: [
      "test/vendor/sinon.js",
      // "test/components/index.js"
      "test/components/bundle.js"
      // {pattern: "test/components/bundle.js", watched: true}
    ],
    client: {
      mocha: {
        ui: 'bdd'
      }
    }
  });
};
