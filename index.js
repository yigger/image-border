const fs = require('fs')
const path = require('path');
const readline = require('readline');
const URL = require('url').URL;
const images = require("images");
const crawlData = require('./crawl_data');
const sharp = require('sharp');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('输入网址：', function (crawl_url) {
  rl.question('输入像素大小（默认 800）：', function (width) {
    rl.question('是否加上边框(y/n)？（默认y）', async function (mode) {
      // 抓取图片
      const url = crawl_url
      const myURL = new URL(url);
      const referer = myURL.origin
      const thief = new crawlData(url, referer);
      const dir = await thief.run();

      // 处理图片并保存
      const storeDir = dir + '/data'
      fs.mkdir(storeDir, function() {});
      console.log("---------------- \n")
      console.log("处理后的存储路径：", storeDir)
      console.log("---------------- \n")
      await walkSync(dir, function (filePath, _) {
        let newFilePath = dealImage(storeDir, filePath, width || 800)
        dealBorder(newFilePath, (mode || 'y') === 'y')
      });
      rl.close();
    });
  });
});

const dealImage = (storeDir, filePath, width) => {
  const paths = filePath.split('/')
  const file = process.platform === "win32" ? path.win32.basename(filePath) : paths[paths.length - 1]

  if (!/\.(jpg|jpeg|png|GIF|JPG|PNG)$/.test(file) ) { 
    return
  }

  images(filePath)
    .resize(Number.parseInt(width))
    .save(storeDir + '/' + file, {
      quality : 90
    })

  console.log(filePath, " 图片质量与像素已处理。");

  return storeDir + '/' + file
}

const dealBorder = async (filePath) => {
  try {
    const buffer = await sharp(filePath)
                        .extend({
                            top: 25,
                            bottom: 25,
                            background: "#FFFFFF"
                        }) 
                        .toBuffer();
    sharp(buffer).toFile(filePath);
    console.log(filePath, "上下边框已处理。");
  } catch (error) {
    console.log(error);
  }
  
}

const walkSync = (currentDirPath, callback) => {
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