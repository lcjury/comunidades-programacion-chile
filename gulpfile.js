var gulp = require("gulp");

gulp.task("css", function () {
  const postcss = require("gulp-postcss");
  const purgecss = require("gulp-purgecss");
  const clean = require("clean-css");

  return gulp
    .src("./src/styles.css")
    .pipe(
      postcss([
        require("tailwindcss"),
        require("autoprefixer"),
        require("postcss-clean"),
      ])
    )
    .pipe(
      purgecss({
        content: ["./src/index.html"],
        keyframes: true,
        // Tailwind extractor https://tailwindcss.com/docs/controlling-file-size#setting-up-purge-css-manually
        // This is the function used to extract class names from your templates
        defaultExtractor: (content) => {
          // Capture as liberally as possible, including things like `h-(screen-1.5)`
          const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];

          // Capture classes within other delimiters like .block(class="w-1/2") in Pug
          const innerMatches =
            content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];

          return broadMatches.concat(innerMatches);
        },
      })
    )
    .pipe(gulp.dest("public/"));
});

gulp.task(
  "build",
  gulp.series(
    "css",
    function () {
      const map = require("map-stream");
      const fs = require("fs");

      return gulp
        .src("./src/index.html")
        .pipe(
          map(function (file, cb) {
            const style = fs.readFileSync("public/styles.css", "utf8");

            var fileContents = file.contents.toString();
            fileContents = fileContents.replace(
              /<link\b[^>]*data-replace="gulp-style\b[^>]*\/>$/gm,
              `<style>${style}</style>`
            );

            file.contents = new Buffer(fileContents);
            cb(null, file);
          })
        )
        .pipe(gulp.dest("./public/"));
    },
    function copyImages() {
      return gulp
        .src(["./src/*.png", "./src/*.ico"])
        .pipe(gulp.dest("./public"));
    }
  )
);

gulp.task("change-text", function () {
  return gulp
    .src("src/css/main.sass")
    .pipe(
      map(function (file, cb) {
        var fileContents = file.contents.toString();
        // --- do any string manipulation here ---
        fileContents = fileContents.replace(/foo/, "bar");
        fileContents = "First line\n" + fileContents;
        // ---------------------------------------
        file.contents = new Buffer(fileContents);
        cb(null, file);
      })
    )
    .pipe(gulp.dest("dist"));
});
