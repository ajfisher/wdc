module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        stylus: {
            compile: {
                options: {
                    linenos: true,
                    compress: false
                },
                files: {
                    'examples/common/css/slides.css': 'examples/common/stylus/slides.styl'
                }
            }
        },
        autoprefixer: {
            dist: {
                files: {
                    'examples/build/css/slides.css': 'examples/common/css/slides.css'
                }
            }
        },
        watch: {
            styles: {
                files: ['examples/common/stylus/*.styl','examples/common/css/*.css'],
                tasks: ['stylus', 'autoprefixer']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
