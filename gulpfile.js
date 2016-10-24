'use strict';

var gulp = require('gulp'),
    options = {},
    fs = require('fs'),
    del = require('del'),
    argv = require('yargs').argv,
    config = require('./gulp.config')(),
    cleanCSS = require('gulp-clean-css'),
    browserSync = require('browser-sync'),
    runSequence = require('run-sequence'),
    concatCss = require('gulp-concat-css'),
    pngquant = require('imagemin-pngquant'),
    stripDebug = require('gulp-strip-debug'),
    realFavicon = require('gulp-real-favicon'),
    FAVICON_DATA_FILE = 'dist/faviconData.json',
    googleWebFonts = require('gulp-google-webfonts'),
    $ = require('gulp-load-plugins')({
        lazy: true
    });

gulp.task('premium-fonts', function() {
    return gulp.src('./app/font/**/*.*')
        .pipe(gulp.dest(config.dist + '/fonts'));
});

gulp.task('html', ['clean-html'], function() {
    return gulp.src('./app/*.html')
        .pipe(gulp.dest(config.dist));
});

gulp.task('sass', ['clean-sass', 'vendor-styles'], function() {
    log('Compiling SASS to CSS.');
    return gulp.src(config.sass)
        .pipe($.plumber({
            errorHandler: onError
        }))
        .pipe($.newer(config.css))
        // .pipe($.sourcemaps.init())
        .pipe($.sass.sync({
            outputStyle: 'compressed',
            precision: 10
        }).on('error', $.sass.logError))
        .pipe($.size({title: '************ FILE SIZE: Styles (before) ****'}))
        .pipe($.if(argv.production, cleanCSS({compatibility: 'ie7'})))
        .pipe($.if(argv.production, $.cssnano()))
        // .pipe($.size({title: '************ FILE SIZE: Styles (after) ****'}))
        .pipe($.autoprefixer({
          browsers: ['last 25 versions'],
          cascade: false
        }))
        // .pipe($.sourcemaps.write('./'))
        .pipe($.if(argv.production, $.rename({suffix: '.min'})))
        .pipe(gulp.dest(config.css))
        .pipe($.notify({
            title: 'Gulp',
            subtitle: 'Success.',
            message: 'Sass successfully complied.',
            sound: "Pop"
        }))
        .pipe(browserSync.stream({ stream: true }));
});

gulp.task('vendor-styles', function() {
    log('Copying Vendor CSS files.');
    return gulp.src(config.vendorCSS)
        // .pipe(concatCss('vendor.css'))
        .pipe($.size({title: '************ FILE SIZE: Vendor Style (before) ****'}))
        .pipe($.if(argv.production, cleanCSS({compatibility: 'ie7'})))
        .pipe($.if(argv.production, $.cssnano()))
        .pipe($.size({title: '************ FILE SIZE: Vendor Styles (after) ****'}))
        .pipe($.if(argv.production, $.rename({suffix: '.min'})))
        .pipe(gulp.dest(config.dist + '/css'))
        .pipe($.notify({
            title: 'Gulp',
            subtitle: 'Success.',
            message: 'Vendor stylesheets successfully copied into Dist folder.',
            sound: "Pop"
        }));
});

gulp.task('scripts', ['clean-scripts', 'vendor-scripts'], function() {
    log('Generating script with Concat and Uglify.');
    return gulp.src(config.script)
        .pipe($.plumber({
            errorHandler: onError
        }))
        // .pipe($.newer(config.dist + '/js'))
        // .pipe($.sourcemaps.init())
        // .pipe($.sourcemaps.write())
        // .pipe($.concat('script.js'))
        .pipe($.size({title: '************ FILE SIZE: Scripts (before) ****'}))
        // .pipe($.if(argv.production, stripDebug()))
        .pipe($.if(argv.production, $.uglify()))
        .pipe($.size({title: '************ FILE SIZE: Scripts (after) ****'}))
        .pipe($.if(argv.production, $.rename({suffix: '.min'})))
        .pipe(gulp.dest(config.dist + '/js'))
        .pipe($.notify({
            title: 'Gulp',
            subtitle: 'Success.',
            message: 'Javascript file successfully generated.',
            sound: "Pop"
        }))
        .pipe(browserSync.stream({ stream: true }));
});

gulp.task('vendor-scripts', function() {
    log('Copying JS files.');
    return gulp.src(config.scripts)
        .pipe($.size({title: '************ FILE SIZE: Vendor Scripts ****'}))
        .pipe(gulp.dest(config.dist + '/js'))
        .pipe($.notify({
            title: 'Gulp',
            subtitle: 'Success.',
            message: 'Vendor scripts successfully copied into Dist folder.',
            sound: "Pop"
        }));
});

gulp.task('images', ['clean-images'], function() {
    log('Copying Images and files.');
    return gulp.src(config.images)
        .pipe($.newer(config.dist + '/images'))
        .pipe($.cache($.imagemin({
          progressive: true,
          svgoPlugins: [{removeViewBox: false}],
          use: [pngquant()]
        })))
        .pipe($.size({title: '************ FILE SIZE: Images ****'}))
        .pipe(gulp.dest(config.dist + '/images'))
        .pipe($.notify({
            title: 'Gulp',
            subtitle: 'Success.',
            message: 'Images successfully optimized.',
            sound: "Pop"
        }));
});

gulp.task('fonts', ['clean-fonts'], function() {
    log('Copying fonts.');
    return gulp.src(config.fonts)
        .pipe($.size({title: '************ FILE SIZE: Fonts ****'}))
        .pipe(gulp.dest(config.dist + '/fonts'))
        .pipe($.notify({
            title: 'Gulp',
            subtitle: 'Success.',
            message: 'Fonts successfully copied into Dist folder.',
            sound: "Pop"
        }));
});

// gulp.task('generate-favicon', function(done) {
//     realFavicon.generateFavicon({
//         masterPicture: './app/images/master_picture.png',
//         dest: './dist/images/icons',
//         iconsPath: '/',
//         design: {
//             ios: {
//                 pictureAspect: 'backgroundAndMargin',
//                 backgroundColor: '#ffffff',
//                 margin: '25%',
//                 appName: 'Test'
//             },
//             desktopBrowser: {},
//             windows: {
//                 pictureAspect: 'whiteSilhouette',
//                 backgroundColor: '#43BCCD',
//                 onConflict: 'override',
//                 appName: 'Test'
//             },
//             androidChrome: {
//                 pictureAspect: 'noChange',
//                 themeColor: '#ffffff',
//                 manifest: {
//                     name: 'Test',
//                     display: 'browser',
//                     orientation: 'notSet',
//                     onConflict: 'override',
//                     declared: true
//                 }
//             },
//             safariPinnedTab: {
//                 pictureAspect: 'silhouette',
//                 themeColor: '#43BCCD'
//             }
//         },
//         settings: {
//             compression: 3,
//             scalingAlgorithm: 'Mitchell',
//             errorOnImageTooSmall: false
//         },
//         versioning: {
//             paramName: 'v',
//             paramValue: 'kPPybMdXj4'
//         },
//         markupFile: FAVICON_DATA_FILE
//     }, function() {
//         done();
//     });
// });
//
// gulp.task('inject-favicon-markups', function() {
//     gulp.src(['dist/*.html'])
//         .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
//         .pipe(gulp.dest('dist'));
// });
//
// gulp.task('check-for-favicon-update', function(done) {
//     var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
//     realFavicon.checkForUpdates(currentVersion, function(err) {
//         if (err) {
//             throw err;
//         }
//     });
// });

gulp.task('clean-bootstrap', function() {
    var files = config.app + '/sass/_bootstrap.scss';
    clean(files);
});
gulp.task('clean-html', function() {
    var files = config.dist + '/*.html';
    clean(files);
});
gulp.task('clean-images', function() {
    var files = config.dist + '/images';
    clean(files);
});
gulp.task('clean-dist', function() {
    var files = config.dist;
    clean(files);
});
gulp.task('clean-sass', function() {
    var files = config.css;
    clean(files);
});
gulp.task('clean-scripts', function() {
    var files = config.dist + '/js';
    clean(files);
});
gulp.task('clean-fonts', function() {
    var files = config.dist + '/fonts';
    clean(files);
});

gulp.task('build', function(cb) {
    runSequence('clean-dist', 'html', 'fonts', 'sass', 'scripts', 'images', 'premium-fonts', cb);
});

gulp.task('default', ['build'], function() {
    browserSync({
        open: true,
        injectChanges: true,
        server: {
            baseDir: './dist'
        },
        watchOptions: {
            debounceDelay: 1000
        }
    });
    gulp.watch(config.sass, ['sass']);
    gulp.watch(config.fonts, ['fonts', browserSync.reload]);
    gulp.watch(config.scripts, ['scripts']);
    gulp.watch(config.images, ['images', browserSync.reload]);
    gulp.watch(config.html, ['html', browserSync.reload]);
});

// Log Function.
function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.red(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.red(msg));
    }
}

// Clean Function.
function clean(path) {
    log('Cleaning: ' + $.util.colors.red(path));
    del.sync(path);
}

// Error
var onError = function(err) {
    $.notify.onError({
        title: "Gulp",
        subtitle: "Failure!",
        message: "Error: <%= error.message %>",
        sound: "Beep"
    })(err);
    this.emit('end');
};
