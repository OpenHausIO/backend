const path = require("path");
const pkg = require("./package.json");

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg,
        env: {
            options: {
                //Shared Options Hash
            },
            prod: {
                NODE_ENV: "production",
            }
        },
        uglify: {
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
                    dest: path.join(process.cwd(), "dist"),
                    //cwd: process.cwd()
                }]
            }
        },
        run: {
            install: {
                options: {
                    cwd: "./dist"
                },
                cmd: "npm",
                args: [
                    "install",
                    "--prod-only"
                ]
            },
            clean: {
                cmd: "rm",
                args: [
                    "-rf",
                    "./dist"
                ]
            },
            copy: {
                exec: "cp ./package*.json ./dist"
            },
            folder: {
                exec: "mkdir ./dist/logs && mkdir ./dist/plugins"
            }
        },
        compress: {
            main: {
                options: {
                    archive: `backend-v${pkg.version}.tgz`
                },
                files: [{
                    expand: true,
                    src: "**/*",
                    cwd: "dist/"
                }]
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-run");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-env");

    grunt.registerTask("clean", ["run:clean"]);

    grunt.registerTask("build", [
        "run:clean",
        "env:prod",
        "uglify",
        "run:folder",
        "run:copy",
    ]);

    // install npm dependencies
    grunt.registerTask("install", [
        "env:prod",
        "run:install",
    ]);

    grunt.registerTask("bundle", [
        "build",
        "install",
        "compress"
    ]);



    // Default task(s).
    //grunt.registerTask("default", ["uglify"]);
    //grunt.registerTask("install", ["install"]);
    //grunt.registerTask("compress", ["compress"]);

};