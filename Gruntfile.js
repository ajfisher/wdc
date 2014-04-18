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
                    'examples/common/css/slides.css': 'examples/common/stylus/slides.styl',
                    'examples/common/css/contrast.css': 'examples/common/stylus/contrast.styl'
                }
            }
        },
        autoprefixer: {
            dist: {
                files: {
                    'examples/build/css/slides.css': 'examples/common/css/slides.css',
                    'examples/build/css/contrast.css': 'examples/common/css/contrast.css'
                }
            }
        },
        watch: {
            styles: {
                files: ['examples/common/stylus/*.styl'],
                tasks: ['stylus', 'autoprefixer']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
