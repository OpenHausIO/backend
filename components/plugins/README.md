| ℹ️ **Contributors**: Please see the [Development](#development) section of this README. |
| -------------------------------------------------------------------------------------- |

https://raw.githubusercontent.com/trufflesuite/truffle/develop/packages/require/require.js

```js
const fs = require("fs");
const path = require("path");
const Module = require("module");
const vm = require("vm");
const originalrequire = require("original-require");
const expect = require("@truffle/expect");
const {
  Web3Shim,
  createInterfaceAdapter
} = require("@truffle/interface-adapter");
const Config = require("@truffle/config");

// options.file: path to file to execute. Must be a module that exports a function.
// options.args: arguments passed to the exported function within file. If a callback
//   is not included in args, exported function is treated as synchronous.
// options.context: Object containing any global variables you'd like set when this
//   function is run.
const Require = {
  file: function(options) {
    let source;
    const file = options.file;
    const config = options.config;

    expect.options(options, ["file"]);

    options = Config.default().with(options);

    source = fs.readFileSync(options.file, { encoding: "utf8" });

    // Modified from here: https://gist.github.com/anatoliychakkaev/1599423
    const m = new Module(file);

    // Provide all the globals listed here: https://nodejs.org/api/globals.html
    const context = {
      __dirname: path.dirname(file),
      __filename: file,
      Buffer,
      clearImmediate,
      clearInterval,
      clearTimeout,
      console,
      exports,
      global,
      process,
      setImmediate,
      setInterval,
      setTimeout,
      config,
      module: m,
      artifacts: options.resolver,
      require: pkgPath => {
        // Ugh. Simulate a full require function for the file.
        pkgPath = pkgPath.trim();

        // If absolute, just require.
        if (path.isAbsolute(pkgPath)) return originalrequire(pkgPath);

        // If relative, it's relative to the file.
        if (pkgPath[0] === ".") {
          return originalrequire(path.join(path.dirname(file), pkgPath));
        } else {
          // Not absolute, not relative, must be a globally or locally installed module.
          // Try local first.
          // Here we have to require from the node_modules directory directly.

          var moduleDir = path.dirname(file);
          while (true) {
            try {
              return originalrequire(
                path.join(moduleDir, "node_modules", pkgPath)
              );
            } catch (e) {}
            var oldModuleDir = moduleDir;
            moduleDir = path.join(moduleDir, "..");
            if (moduleDir === oldModuleDir) break;
          }

          // Try global, and let the error throw.
          return originalrequire(pkgPath);
        }
      }
    };

    // Now add contract names.
    Object.keys(options.context || {}).forEach(key => {
      context[key] = options.context[key];
    });

    const old_cwd = process.cwd();

    process.chdir(path.dirname(file));

    const script = vm.createScript(source, file);
    script.runInNewContext(context);

    process.chdir(old_cwd);

    return m.exports;
  },

  exec: function(options, done) {
    expect.options(options, [
      "contracts_build_directory",
      "file",
      "resolver",
      "provider",
      "network",
      "network_id"
    ]);

    const interfaceAdapter = createInterfaceAdapter({
      provider: options.provider,
      networkType: options.networks[options.network].type
    });
    const web3 = new Web3Shim({
      provider: options.provider,
      networkType: options.networks[options.network].type
    });

    try {
      const fn = this.file({
        file: options.file,
        context: { web3, interfaceAdapter },
        resolver: options.resolver,
        config: options
      });
      fn(done);
    } catch (error) {
      done(error);
    }
  }
};

module.exports = Require;

```