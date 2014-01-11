module.exports = function(grunt) {

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-git-describe");
    grunt.loadNpmTasks('grunt-jsdoc');

    var packageJson = grunt.file.readJSON("package.json"),
        docsSources = [
            'docs/docs-globals.js',
            '../OpenSeadragonViewerInputHook/build/openseadragonviewerinputhook/openseadragon-viewerinputhook.js',
            '../OpenSeadragonImagingHelper/build/openseadragonimaginghelper/openseadragon-imaginghelper.js',
            '../OpenSeadragonAnnoHost/build/openseadragonannohost/openseadragon-annohost.js',
            'docs/INDEX.md'
        ],
        buildDir = 'build/',
        docsDir = buildDir + 'docs/',
        publishDir = '../msalsbery.github.io/builds/';

    grunt.initConfig({
        pkg: packageJson,
        imagingVersion: {
            versionStr: packageJson.version,
            major:      parseInt(packageJson.version.split('.')[0], 10),
            minor:      parseInt(packageJson.version.split('.')[1], 10),
            revision:   parseInt(packageJson.version.split('.')[2], 10)
        },
        "git-describe": {
            build: {
                options: {
                    prop: "gitInfo"
                }
            }
        },
        clean: {
            build: {
                src: [buildDir]
            },
            doc: {
                src: [docsDir]
            }
        },
        jsdoc : {
            dist : {
                src: docsSources, 
                options: {
                    destination: docsDir,
                    //template: "node_modules/docstrap/template",
                    configure: 'doc-conf.json'
                }
            }
        }
    });

    // Copies built source to demo site folder
    grunt.registerTask('publish', function() {
        grunt.file.copy(distribution, publishDir + distributionName);
        grunt.file.copy(minified, publishDir + minifiedName);
    });

    // Build task(s).
    grunt.registerTask('build', ['clean:build', 'jshint:beforeconcat', 'git-describe', 'concat', 'jshint:afterconcat', 'uglify']);

    // Documentation task(s).
    grunt.registerTask('doc', ['clean:doc', 'jsdoc']);

    // Default task(s).
    grunt.registerTask('default', ['build']);

};