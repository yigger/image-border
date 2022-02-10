const fs = require('fs')
const path = require('path');
const readline = require('readline');
// const images = require("images");
const sizeOf = require('image-size')
// const getPixels = require("get-pixels")
const URL = require('url').URL;
const crawlData = require('./crawl_data');
const sharp = require('sharp');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const run = async () => {
  console.log("-----------------------------------")
  console.log("| 欢迎使用 yy-image，退出： Ctrl+c |")
  console.log("-----------------------------------")
  rl.question('输入抓取图片的网址（多个网址用空格分开）：', function (crawl_url) {
    rl.question('输入像素宽度大小（默认 1800）：', function (width) {
      rl.question('是否加上边框(y/n)？（默认y）', async function (mode) {
        const urls = crawl_url.split(' ')
        for(let url of urls) {
          try {
            await imageBorder(url, width, mode)
          } catch (e) {
            console.log("error：", e)
          }
        }

        console.log('处理的地址如下：')
        console.log(urls)
        console.log("已经全部处理完毕。可进入下一轮。 \n\n\n")
        
        await run()
      });
    });
  });
}

const imageBorder = async (url, width, mode) => {
  const myURL = new URL(url);
  const referer = myURL.origin
  const thief = new crawlData(url, referer);
  const dir = await thief.run();

  const storeDir = dir + '/data'
  const storeSizeDir = dir + '/size'
  fs.mkdir(storeDir, function() {});
  fs.mkdir(storeSizeDir, function() {});
  const files = []
  walkSync(dir, (filePath, _) => files.push(filePath));

  const filePaths = await runImageSize(files, storeSizeDir, width)
  await runBorder(filePaths, storeDir, mode)
}

const runImageSize = async (files, storeDir, width) => {
  const borderFilePaths = []
  // 处理像素
  console.log("正在压缩图片质量，请稍等...")
  for(let filePath of files) {
    let outputObj = await dealImage(storeDir, filePath, width || 1800)
    borderFilePaths.push(outputObj)
  }
  console.log("图片质量已全部压缩。");
  return borderFilePaths
}

const dealImage = async (storeDir, filePath, width) => {
  const paths = filePath.split('/')
  const file = process.platform === "win32" ? path.win32.basename(filePath) : paths[paths.length - 1]
  const outputObj = {
    store_path: storeDir + '/' + file,
    filename: file,
    store_dir: storeDir
  }

  if (!/\.(jpg|jpeg|png|GIF|JPG|PNG)$/.test(file) ) { 
    return
  }

  const img = await sharp(filePath)
  const metadata = sizeOf(filePath)
  if (metadata.width > Number.parseInt(width)) {
    try {
      img.resize(Number.parseInt(width)).jpeg({ quality: 90 }).toFile(outputObj.store_path)
    } catch(e){}
  } else {
    img.jpeg({ quality: 100 }).toFile(outputObj.store_path)
  }

  console.log(`${outputObj.store_path} 图片质量已处理.`);
  return outputObj
}

const runBorder = async (borderFilePaths, storeDir, mode) => {
  // 处理上下边框
  console.log("正在处理上下边框，请稍等...")
  for (let newFileObj of borderFilePaths) {
    await dealBorder(newFileObj, storeDir, (mode || 'y') === 'y')
  }
  console.log("上下边框已全部处理。");
}

const dealBorder = async (obj, storeDir) => {
  try {
    console.log()
    const buffer = await sharp(obj.store_path)
                        .extend({
                            top: 5,
                            bottom: 5,
                            background: "#FFFFFF"
                        }) 
                        .toBuffer();
    sharp(buffer).toFile(obj.store + '/' + obj.filename);
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

run()