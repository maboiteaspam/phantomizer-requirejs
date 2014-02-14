
module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadNpmTasks('phantomizer-requirejs');


  grunt.registerTask('default',
      [
          'phantomizer-requirejs:testmin'
          ,'phantomizer-requirecss:testmin'
      ]);
};
