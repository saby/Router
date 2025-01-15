/* eslint-disable */
let path = require('path'),
   fs = require('fs'),
   nyc = require('nyc'),
   routerPath = path.join(__dirname, 'Router'),
   coveragePath = require('./package.json')['saby-units']['jsonCoverageReport'],
   coverageAllPath = path.join(__dirname, 'artifacts', 'coverageAll.json'),
   coverageRouterPath = path.join(
      __dirname,
      'artifacts',
      'coverageRouter.json'
   ),
   allFiles = [];

// функция пробегает по папке и находит все js файлы
let dirWalker = function (dir) {
   let pattern = /\.js$/,
      files = fs.readdirSync(dir),
      newPath = '';
   for (let i = 0; i < files.length; i++) {
      newPath = path.join(dir, files[i]);
      if (fs.statSync(newPath).isDirectory()) {
         dirWalker(newPath);
      } else {
         if (pattern.test(files[i])) {
            allFiles.push(newPath);
         }
      }
   }
};

// пробегаем по папкам Router
dirWalker(routerPath);

let rawCover = fs.readFileSync(coveragePath, 'utf8'),
   cover = JSON.parse(rawCover),
   newCover = {},
   instrumenter = new nyc().instrumenter(),
   transformer = instrumenter.instrumentSync.bind(instrumenter),
   routerFiles = allFiles.filter((file) => file.includes('/Router/'));

// функция дописывает 0 покрытие для файлов которые не использовались в тестах
// и меняет относительные пути на абсолютные
function coverFiles(files, replacer) {
   files.forEach((file) => {
      let relPath = file.replace(replacer, '').slice(1),
         rootPaths = replacer.split(path.sep),
         rootDir = rootPaths[rootPaths.length - 1],
         absolutePath = [rootDir, relPath].join(path.sep),
         coverData = cover[absolutePath];
      if (!coverData) {
         try {
            let rawFile = fs.readFileSync(file, 'utf-8');
            transformer(rawFile, file);
            let coverState = instrumenter.lastFileCoverage();
            Object.keys(coverState.s).forEach((key) => (coverState.s[key] = 0));
            newCover[file] = coverState;
            console.log(
               'File ' +
                  file.replace(__dirname, '').slice(1) +
                  ' not using in tests'
            );
         } catch (err) {
            console.log(
               'File ' +
                  file.replace(__dirname, '').slice(1) +
                  " can't be instrumented, pls try later"
            );
         }
      } else {
         coverData['path'] = file;
         newCover[file] = coverData;
      }
   });
}

// дописываем 0 покрытия для файлов которые не использовались в тестах
coverFiles(routerFiles, routerPath);

// функция возвращает покрытие для опредленного пути
function getCoverByPath(value) {
   let coverageByPath = {};
   Object.keys(newCover).forEach(function (name) {
      if (name.includes(value)) {
         coverageByPath[name] = newCover[name];
      }
   });
   return coverageByPath;
}

let routerCoverage = getCoverByPath(routerPath);

// сохраняем покрытие Общее, Router
fs.writeFileSync(coverageAllPath, JSON.stringify(newCover), 'utf8');
fs.writeFileSync(coverageRouterPath, JSON.stringify(routerCoverage), 'utf8');
