const path = require("path");
const pkg = require("./package.json");
const cp = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");

const PATH_DIST = path.resolve(process.cwd(), "dist");
const PATH_BUILD = path.resolve(process.cwd(), "build");

process.env = Object.assign({
    NODE_ENV: "production"
}, process.env);

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg,
        uglify: {
            // NOTE: if true, this truncate variables&class names
            // Are original names neede for production?!
            // i dont thinks so, its only usefull in development
            options: {
                mangle: {
                    toplevel: true
                }
            },
            build: {
                files: [{
                    expand: true,
                    src: [
                        //"package.json",
                        //"package-lock.json",
                        "**/*.js",
                        "!plugins/**",
                        "**/*.gitkeep",
                        "!Gruntfile.js",
                        "!node_modules/**",
                        "!scripts/**",
                        "!tests/**"
                    ],
                    dest: PATH_BUILD,
                    //cwd: process.cwd()
                }]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");


    grunt.registerTask("build", () => {
        [
            `rm -rf ${path.join(PATH_BUILD, "/*")}`,
            `rm -rf ${path.join(PATH_DIST, "/*")}`,
            `mkdir ${path.join(PATH_BUILD, "logs")}`,
            `mkdir ${path.join(PATH_BUILD, "plugins")}`,
            `mkdir ${path.join(PATH_BUILD, "scripts")}`,
            `echo "exit 0" > ${path.join(PATH_BUILD, "scripts/post-install.sh")}`,
            `chmod +x ${path.join(PATH_BUILD, "scripts/post-install.sh")}`,
            `cp ./package*.json ${PATH_BUILD}`,
            "grunt uglify",
        ].forEach((cmd) => {
            cp.execSync(cmd, {
                env: process.env,
                stdio: "inherit"
            });
        });
    });


    grunt.registerTask("install", () => {
        cp.execSync(`cd ${PATH_BUILD} && npm install --prod-only`, {
            env: process.env,
            stdio: "inherit"
        });
    });


    grunt.registerTask("compress", () => {
        cp.execSync(`cd ${PATH_BUILD} && tar -czvf ${path.join(PATH_DIST, `${pkg.name}-v${pkg.version}.tgz`)} *`, {
            env: process.env,
            stdio: "inherit"
        });
    });


    grunt.registerTask("build:docker", () => {
        cp.execSync(`docker build . -t openhaus/${pkg.name}:latest --build-arg version=${pkg.version}`, {
            env: process.env,
            stdio: "inherit"
        });
    });


    grunt.registerTask("checksum", () => {

        let m5f = path.join(PATH_DIST, "./checksums.md5");

        fs.rmSync(m5f, { force: true });
        let files = fs.readdirSync(PATH_DIST);
        let fd = fs.openSync(m5f, "w");

        files.forEach((name) => {

            let file = path.join(PATH_DIST, name);
            let content = fs.readFileSync(file);
            let hasher = crypto.createHash("md5");
            let hash = hasher.update(content).digest("hex");
            fs.writeSync(fd, `${hash}\t${name}${os.EOL}`);

        });

        fs.closeSync(fd);

    });


    grunt.registerTask("release", () => {
        [
            "grunt build",
            "grunt compress",
            "grunt build:docker",
            `docker save openhaus/${pkg.name}:latest | gzip > ${path.join(PATH_DIST, `${pkg.name}-v${pkg.version}-docker.tgz`)}`,
            "grunt install",
            `cd ${PATH_BUILD} && tar -czvf ${path.join(PATH_DIST, `${pkg.name}-v${pkg.version}-bundle.tgz`)} *`,
            "grunt checksum"
        ].forEach((cmd) => {
            cp.execSync(cmd, {
                env: process.env,
                stdio: "inherit"
            });
        });
    });


};