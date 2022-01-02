const gm = require('gm').subClass({imageMagick: true});
const fs = require('fs')
const path = require('path');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('输入文件夹路径：', function (dir) {
  rl.question('输入宽度大小（默认 600）：', function (width) {
    rl.question('是否加上边框(y/n)？（默认y）', async function (mode) {
      const storeDir = dir + '/data'
      fs.mkdir(storeDir, function() {});
      console.log("---------------- \n")
      console.log("处理后的存储路径：", storeDir)
      console.log("---------------- \n")
      await walkSync(dir, function (filePath, _) {
        dealImage(storeDir, filePath, width || 600, mode === 'y')
      });
      rl.close();
    });
  });
});



const dealImage = (storeDir, filePath, width, addBorder = true) => {
  const paths = filePath.split('/')
  const file = paths[paths.length - 1]
  const g = addBorder ? gm(filePath).borderColor('white').border(0, 50) : gm(filePath)
  g.resize(width)
   .write(storeDir + '/' + file, function (err) {
    if (!err) {
      console.log(filePath, " 已处理。");
    }
  });
}

function walkSync(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach(function (name) {
      var filePath = path.join(currentDirPath, name);
      var stat = fs.statSync(filePath);
      if (stat.isFile()) {
          callback(filePath, stat);
      } else if (stat.isDirectory()) {
          walkSync(filePath, callback);
      }
  });
}