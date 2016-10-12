module.exports = function(grunt) {

    grunt.initConfig({
        compress: {
            main: {
                options: {
	            mode: 'zip',
		    level: 2,
                    archive: 'TeamCityGadget.zip'
                },
                files: [
                    {expand: true, cwd: 'src/', src: ['css/**'], dest: '/'},
                    {expand: true, cwd: 'src/', src: ['images/**'], dest: '/'},
                    {expand: true, cwd: 'src/', src: ['scripts/**'], dest: '/'},
                    {expand: true, cwd: 'src/', src: ['drag.png'], dest: '/'},
                    {expand: true, cwd: 'src/', src: ['flyout_details.html'], dest: '/'},
                    {expand: true, cwd: 'src/', src: ['gadget.html'], dest: '/'},
                    {expand: true, cwd: 'src/', src: ['gadget.xml'], dest: '/'},
                    {expand: true, cwd: 'src/', src: ['icon.png'], dest: '/'},
                    {expand: true, cwd: 'src/', src: ['settings.html'], dest: '/'}
                ]
            }
        },
        rename: {
            moveThis: {
                src: 'TeamCityGadget.zip',
                dest: './dist/TeamCityGadget.gadget'
            }
        },
        carma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-rename');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['compress','rename']);
    grunt.registerTask('test', ['carma']);
};