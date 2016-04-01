var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var exec = require('child_process').exec;
var minifyCss = require('gulp-minify-css');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function(){
	gulp.watch('./css/*.less', ['less']);
	exec('node server.js');
});

gulp.task('less', function () {
  return gulp.src('./css/styles.less')
    .pipe(sourcemaps.init())
    .pipe(less())
	.pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./css/'));
});