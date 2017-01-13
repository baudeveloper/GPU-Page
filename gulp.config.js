module.exports = function() {
    var config = {
        // Root locations
        dist: './dist',
        app: './app',
        js: './dist/js/**/*.js',
        // Locations
        scripts: [
            './bower_components/jquery/dist/jquery.min.js',
            './bower_components/bootstrap-sass/assets/javascripts/bootstrap.min.js',
            './bower_components/bootstrap-select/dist/js/bootstrap-select.min.js',
            './bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min.js',
            './bower_components/html5shiv/dist/html5shiv.min.js'
        ],
        script: [
            './app/js/*.js'
        ],
        vendorCSS: [
            './bower_components/bootstrap-select/dist/css/bootstrap-select.min.css',
            './bower_components/seiyria-bootstrap-slider/dist/css/bootstrap-slider.min.css'
        ],
        // ./app Locations
        html: './app/*.html',
        css: './dist/css',
        images: [
            './app/images/**/*.+(png|jpg|jpeg|gif|svg)',
            // '!' + './app/images/master_picture.png'
        ],
        sass: './app/sass/**/*.scss',
        // Fonts Locations
        fonts: [
            './bower_components/font-awesome/fonts/**/*.*',
            './bower_components/bootstrap-sass/assets/fonts/bootstrap/**/*.*'
        ],
        // JSON Locations
        json: [
            './app/*.json'
        ]
    };
    return config;
};
