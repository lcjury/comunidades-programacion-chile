var gulp = require("gulp");

var communityTemplate = function (community) {
  return `
    <div class="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center">
      <div class="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg">
        <div class="px-4 py-5 flex-auto">
          <img class="rounded-full w-32 h-32 m-auto -mt-12" src="${community.logo}"/>
          <h6 class="text-xl font-semibold">${community.name}</h6>
          <p class="mt-2 mb-4 text-gray-600 flex justify-center">
            ${community.twitter ? `<a href="https://twitter.com/${community.twitter}" title="${community.longName} en twitter" target="_blank"><svg class="transition duration-200 hover:text-blue-400 h-6 w-6"><use xlink:href="#twitter" /></svg></a>`: ''}
            ${community.facebook ? `<a href="https://www.facebook.com/${community.facebook}" title="${community.longName} en facebook" target="_blank"><svg class="transition duration-200 hover:text-blue-600 h-6 w-6 ml-4"><use xlink:href="#facebook" /></svg></a>`: ''}
            ${community.web ? `<a href="${community.web}" title="sitio web de ${community.longName}" target="_blank"><svg class="transition duration-200 hover:text-gray-800 h-6 w-6 ml-4"><use xlink:href="#network" /></svg></a>`: ''}
            ${community.discord ? `<a href="${community.discord}" title="sitio discord de ${community.longName}" target="_blank"><svg class="transition duration-200 hover:text-indigo-400 h-6 w-6 ml-4"><use xlink:href="#discord"></use></svg></a>`: ''}
          </p>
        </div>
      </div>
    </div>
  `;
};

function buildCommunities () {
  const inject = require('gulp-inject');
  const jsonValues = require('./src/communities.json');

  return gulp.src('./src/index.html')
    .pipe(inject(
      gulp.src(['./src/communities.json'], {read: false}, {starttag: '<!-- inject:{{ext}} -->'}), {
        transform: function (filepath) {
          return jsonValues.reduce(function (acc, community) {
            return acc + communityTemplate(community);
          }, '');
        }
      }
    ))
    .pipe(gulp.dest("public/"));
};

function injectCSS () {
  const map = require("map-stream");
  const fs = require("fs");

  return gulp
    .src("./public/index.html")
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
}

function copyImages () {
  return gulp
    .src(["./src/*.png", "./src/*.ico"])
    .pipe(gulp.dest("./public"));
}

function buildCSS () {
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
        content: ["./public/index.html"],
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
};

gulp.task(
  "build",
  gulp.series(
    buildCommunities,
    buildCSS,
    injectCSS,
    copyImages
  )
);
