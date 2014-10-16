	var getScriptOptions = function () {

		var options = {},
			parts, src, query, startFile, env,
			scripts = document.getElementsByTagName("script");

		var script = scripts[scripts.length - 1];

		if (script) {

			// Split on question mark to get query
			parts = script.src.split("?");
			src = parts.shift();
			query = parts.join("?");

			// Split on comma to get startFile and env
			parts = query.split(",");

			if (src.indexOf("steal.production") > -1) {
				options.env = "production";
			}

			if (parts[0]) {
				options.startId = parts[0];
			}
			// Grab env
			if (parts[1]) {
				options.env = parts[1];
			}

			// Split on / to get rootUrl
			parts = src.split("/");
			var lastPart = parts.pop();
			
			options.stealPath = parts.join("/");

			each(script.attributes, function(attr){
				var optionName = 
					camelize( attr.nodeName.indexOf("data-") === 0 ?
						attr.nodeName.replace("data-","") :
						attr.nodeName );
				options[optionName] = attr.value;
			});

		}

		return options;
	};

	steal.startup = function(config){

		// Get options from the script tag
		if(global.document) {
			var urlOptions = getScriptOptions();
		} else {
			// or the only option is where steal is.
			var urlOptions = {
				stealPath: __dirname
			};
		}

		// B: DO THINGS WITH OPTIONS
		// CALCULATE CURRENT LOCATION OF THINGS ...
		System.config(urlOptions);
		
		if(config){
			System.config(config);
		}

		// Read the env now because we can't overwrite everything yet

		// immediate steals we do
		var steals = [];

		// we only load things with force = true
		if ( System.env == "production" && System.main ) {
			
			// Override instantiate temporarily to ensure @config is loaded
			// before System.main
			var baseInstantiate = System.instantiate;
			var configDeps = [];
			System.instantiate = function(load) {
				var loader = this;
				if(loader.defined["@config"] && load.name !== "@config" &&
				   configDeps.indexOf(load.name) === -1) {
					return loader.import("@config").then(function() {
						System.instantiate = baseInstantiate;
						return baseInstantiate.call(loader, load);
					});
				}

				if(load.name === "@config") {
					return baseInstantiate.call(this, load).then(function(instantiateResult) {
						configDeps = instantiateResult.deps.slice();
						return instantiateResult;
					});
				}
				
				return baseInstantiate.call(this, load);
			};

			return appDeferred = System.import(System.main)["catch"](function(e){
				console.log(e);
			});

		} else if(System.env == "development"){

			configDeferred = System.import("@config");

			devDeferred = configDeferred.then(function(){
				// If a configuration was passed to startup we'll use that to overwrite
				// what was loaded in stealconfig.js
				// This means we call it twice, but that's ok
				if(config) {
					System.config(config);
				}

				return System.import("@dev");
			},function(e){
				console.log("steal - error loading @config.",e);
				return steal.System.import("@dev");
			});

			appDeferred = devDeferred.then(function(){
				// if there's a main, get it, otherwise, we are just loading
				// the config.
				if(!System.main) {
					return configDeferred;
				}
				var main = System.main;
				if(typeof main === "string") {
					main = [main];
				}
				return Promise.all( map(main,function(main){
					return System.import(main)
				}) );
			}).then(function(){
				if(steal.dev) {
					steal.dev.log("app loaded successfully")
				}
			}, function(error){
				console.log("error",error,  error.stack);
			});
			return appDeferred;
		}
	};
	steal.done = function(){
		return appDeferred;
	};
	return steal;

