var gulp = require('gulp');
var watch = require('gulp-watch');
var stylus = require('gulp-stylus');
var sourcemaps = require('gulp-sourcemaps');
var pump = require('pump');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var image = require('gulp-image');
var gutil = require('gulp-util');
var print = require('gulp-print');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');

var src = gulp.src;
var dest = gulp.dest;

gulp.task('stylus', function (cb) {
    pump([
        src('src/themes/*.styl'), stylus(), autoprefixer(), print(), dest('./dist/themes'),
        cleanCSS(), rename({suffix: '.min'}), dest('./dist/themes')
    ], cb)
});


gulp.task('js', function (cb) {
    pump([
        src('src/index.js'),
        rename('jquery.campsi-login.js'),
        print(),
        dest('dist'),
        uglify(),
        rename('jquery.campsi-login.min.js'),
        dest('dist')
    ], cb)
});

gulp.task('assets', function (cb) {
    pump([
        src('src/themes/_assets/**/*'),
        // image(),
        dest('dist/themes/_assets')
    ], cb)
});

// Rerun the task when a file changes
gulp.task('watch', function () {
    gulp.watch('src/index.js', ['js']);
    gulp.watch('src/themes/**/*.styl', ['stylus']);
});

gulp.task('dist', ['stylus', 'js']);
gulp.task('default', ['dist', 'watch']);

