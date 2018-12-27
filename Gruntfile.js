/* eslint-env node, es6 */

module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');

	var packageJson = grunt.file.readJSON('package.json');
	var publishRepoDir = '../msalsbery.github.io/openseadragon-imaging/';

	var publishRepoCleanDirs = [
		publishRepoDir + 'builds/',
		publishRepoDir + 'demo/',
		publishRepoDir + 'docs/',
		publishRepoDir + 'site/'
	];
	var publishSources = ['builds/**', 'demo/**', 'docs/**', 'site/**'];

	grunt.initConfig({
		pkg: packageJson,
		imagingVersion: {
			versionStr: packageJson.version
		},
		clean: {
			prod: {
				src: publishRepoCleanDirs,
				options: {
					force: true
				}
			}
		},
		copy: {
			prod: {
				files: [
					{
						expand: true,
						cwd: './',
						src: publishSources,
						dest: publishRepoDir
					}
				]
			}
		}//,
		// watch: {
		// 	files: ['Gruntfile.js', srcDir + '*.js'],
		// 	tasks: ['build']
		// 	//options: {
		// 	//    event: ['added', 'deleted'], //'all', 'changed', 'added', 'deleted'
		// 	//}
		// }
	});

	// Copies home site, demo site, builds, and docs to msalsbery.github.io repo folder
	grunt.registerTask('publish', ['clean:prod', 'copy:prod']);

	// Default task(s).
	grunt.registerTask('default', ['publish']);
};
