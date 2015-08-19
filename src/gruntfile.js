module.exports = function(grunt) {

    grunt.initConfig({
        compress: {
            main: {
                options: {
                    archive: 'TeamCityGadget.zip'
                },
                files: [
                    {src: ['css/**'], dest: '/'},
                    {src: ['images/**'], dest: '/'},
                    {src: ['scripts/**'], dest: '/'},
                    {src: ['drag.png'], dest: '/'},
                    {src: ['flyout_details.html'], dest: '/'},
                    {src: ['gadget.html'], dest: '/'},
                    {src: ['gadget.xml'], dest: '/'},
                    {src: ['icon.png'], dest: '/'},
                    {src: ['settings.html'], dest: '/'}
                ]
            }
        },
        rename: {
            moveThis: {
                src: 'TeamCityGadget.zip',
                dest: '../output/TeamCityGadget.gadget'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-rename');

    grunt.registerTask('default', ['compress','rename']);
};