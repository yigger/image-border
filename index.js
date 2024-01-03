const fs = require('fs')
const path = require('path');
const readline = require('readline');
const sizeOf = require('image-size')
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
        rl.question('相册密码？（默认无）', async function (password) {
          const urls = crawl_url.split(' ')
          for(let url of urls) {
            if (/^https?:\/\//.test(url)) {
              await imageBorder(url, width, mode, password)
            }
          }

          await console.log('处理的地址如下：')
          await console.log(urls)
          await run()
        })
      });
    });
  });
}

const imageBorder = async (url, width, mode, password) => {
  const myURL = new URL(url);
  const referer = myURL.origin;
  const thief = new crawlData(url, referer, password);
  const dir = await thief.run();
  const clothesUniqCode = dir.split('/').pop();

  const storeDir = dir + '/' + clothesUniqCode;
  const storeSizeDir = dir + '/size';

  fs.rmSync(storeDir, { recursive: true, force: true });
  fs.rmSync(storeSizeDir+"/model", { recursive: true, force: true });
  fs.rmSync(storeSizeDir, { recursive: true, force: true });

  // 处理边框后的存储路径
  fs.mkdirSync(storeDir, function() {});
  // fs.mkdirSync(storeDir+"/model", function() {});

  // 处理图片大小后的存储路径
  fs.mkdirSync(storeSizeDir, function() {});
  fs.mkdirSync(storeSizeDir+"/model", function() {});

  const files = []
  walkSync(dir, (filePath, _) => files.push(filePath));

  const filePaths = await runImageSize(files, storeSizeDir, width)
  await runBorder(filePaths, storeDir, mode)
}

const runImageSize = async (files, storeDir, width) => {
  const borderFilePaths = [];
  for (const filePath of files) {
    const outputObj = await dealImage(storeDir, filePath, width || 1500);
    if (outputObj) {
      borderFilePaths.push(outputObj);
    } else {
      console.log("格式不正确");
    }
  }
  return borderFilePaths
}

const dealImage = async (storeDir, filePath, width) => {
  const paths = filePath.split('/')
  const file = process.platform === "win32" ? path.win32.basename(filePath) : paths[paths.length - 1]
  const outputObj = {
    model_store_path: storeDir + '/model/' + file, 
    store_path: storeDir + '/' + file,
    filename: file,
    store_dir: storeDir
  }
  if (!/\.(jpg|jpeg|png|GIF|JPG|PNG)$/.test(file) ) { 
    return false
  }
  const img = await sharp(filePath)
  const metadata = await sizeOf(filePath)
  // 模特图的处理方式
  if (metadata && (metadata.height - metadata.width > 50)) {
    if (metadata.width >= 2500) {
      // 像素太大，处理为 2000px 的像素，为了淘宝的 4:3 图片可以上传
      img.resize(2000)
          .jpeg({ quality: 70 })
          .toFile(outputObj.model_store_path)
    } else {
      img.jpeg({ quality: 70 })
          .toFile(outputObj.model_store_path)
    }
    console.log(`${outputObj.store_path} 模特图的质量已处理.`);
  } else {
    if (metadata.width > Number.parseInt(width)) {
      try {
        img.resize(Number.parseInt(width)).jpeg({ quality: 90 }).toFile(outputObj.store_path)
      } catch(e){
        console.log(e)
      }
    } else {
      img.jpeg({ quality: 100 }).toFile(outputObj.store_path)
    }
    console.log(`${outputObj.store_path} 图片质量已处理.`);
  }
  
  return outputObj
}

const runBorder = async (borderFilePaths, storeDir, mode) => {
  // 处理上下边框
  console.log("正在处理上下边框，请稍等...")
  console.log("等待 2 秒")
  await sleep(2000)
  for (let newFileObj of borderFilePaths) {
    await dealBorder(newFileObj, storeDir, (mode || 'y') === 'y')
  }
  console.log("上下边框已全部处理。");
}

const dealBorder = (obj, storeDir) => {
  var output_path = storeDir + '/' + obj.filename
  if (!fs.existsSync(obj.store_path)) {
    return false
  }

  try {
    const metadata = sizeOf(obj.store_path)
    // 过滤模特图
    if (metadata.height - metadata.width > 50) {
      // output_path = storeDir + '/model/' + obj.filename
      return false
    }
  } catch (e) {}

  sharp(obj.store_path)
                      .extend({
                          top: 20,
                          bottom: 20,
                          left: 20,
                          right: 20,
                          background: "#FFFFFF"
                      })
                      .toFile(output_path)
                      .catch(err =>{
                        console.log("image-board sharpError: ", err);    
                       });
  console.log(output_path, "上下边框已处理。");
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

const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCurrentLine() {
  const err = new Error();
  return err.stack.split('\n')[2].trim();
}

run()