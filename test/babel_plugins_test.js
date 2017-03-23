var QUnit = require("steal-qunit");
var makeIframe = require("./make_iframe");
var supportsES = require("./supports_proto")();

(supportsES ? QUnit.module : QUnit.skip)("babel plugins", function(hooks) {
	QUnit.test("babel plugins works", function(assert) {
		makeIframe("babel_plugins/dev.html", assert);
	});

	QUnit.test("passing options to babel plugins works", function(assert) {
		makeIframe("babel_plugin_options/dev.html", assert);
	});

	QUnit.test("babel plugins on npm work", function(assert) {
		makeIframe("babel_npm_plugins/dev.html", assert);
	});
});
