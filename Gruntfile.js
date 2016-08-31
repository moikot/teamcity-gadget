module.exports = function(grunt) {

    grunt.initConfig({
        compress: {
            main: {
                options: {
                    archive: 'TeamCityGadget.zip'
                },
                files: [
                    {src: ['src/css/**'], dest: '/'},
                    {src: ['src/images/**'], dest: '/'},
                    {src: ['src/scripts/**'], dest: '/'},
                    {src: ['src/drag.png'], dest: '/'},
                    {src: ['src/flyout_details.html'], dest: '/'},
                    {src: ['src/gadget.html'], dest: '/'},
                    {src: ['src/gadget.xml'], dest: '/'},
                    {src: ['src/icon.png'], dest: '/'},
                    {src: ['src/settings.html'], dest: '/'}
                ]
            }
        },
        rename: {
            moveThis: {
                src: 'TeamCityGadget.zip',
                dest: './dist/TeamCityGadget.gadget'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-rename');

    grunt.registerTask('default', ['compress','rename']);
};