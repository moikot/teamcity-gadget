module.exports = function(grunt) {

    grunt.initConfig({
        compress: {
            main: {
                options: {
                    archive: 'TeamCityGadget.zip'
                },
                files: [
                    {src: ['css/**'], dest: 'css/'},
                    {src: ['images/**'], dest: 'images/'},
                    {src: ['scripts/**'], dest: 'scripts/'},
                    {src: ['drag.png'], dest: '/'},
                    {src: ['flyout_details.html'], dest: '/'},
                    {src: ['gadget.html'], dest: '/'},
                    {src: ['gadget.xml'], dest: '/'},
                    {src: ['icon.png'], dest: '/'},
                    {src: ['settings.html'], dest: '/'}
                ]
            },
            rename: {
                moveThis: {
                    src: 'test/this',
                    dest: 'output/'
                },

                // Any number of targets here...

                moveThat: {
                    src: 'test/that',
                    dest: 'output/that'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', ['compress']);
};