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

  // 处理图片并保存
  const storeDir = dir + '/data'
  fs.mkdir(storeDir, function() {});
  console.log("---------------- \n")
  console.log("处理后的存储路径：", storeDir)
  console.log("---------------- \n")
  
  // 处理像素
  const borderFilePaths = []
  console.log("正在压缩图片质量，请稍等...")
  await walkSync(dir, async function (filePath, _) {
    let newFilePath = dealImage(storeDir, filePath, width || 1800)
    borderFilePaths.push(newFilePath)
  });
  console.log("图片质量已全部压缩。");

  // 处理上下边框
  console.log("正在处理上下边框，请稍等...")
  for (let newFilePath of borderFilePaths) {
    await dealBorder(newFilePath, (mode || 'y') === 'y')
  }
  console.log("上下边框已全部处理。");
}

const dealImage = (storeDir, filePath, width) => {
  const paths = filePath.split('/')
  const file = process.platform === "win32" ? path.win32.basename(filePath) : paths[paths.length - 1]

  if (!/\.(jpg|jpeg|png|GIF|JPG|PNG)$/.test(file) ) { 
    return
  }
  const img = images(filePath)
  if (img.width() <= Number.parseInt(width)) {
    img.save(storeDir + '/' + file, { quality : 90 })
  } else {
    img.resize(Number.parseInt(width))
       .save(storeDir + '/' + file, {
         quality : 90
       })
  }

  console.log(`${filePath} 图片质量已处理.`);
  return storeDir + '/' + file
}

const dealBorder = async (filePath) => {
  try {
    const buffer = await sharp(filePath)
                        .extend({
                            top: 5,
                            bottom: 5,
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

run()