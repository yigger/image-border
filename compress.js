const fs = require('fs')
const path = require('path');
const sharp = require('sharp');

function addNewToFileName(filePath) {
  const fileName = path.basename(filePath);
  const fileExtension = path.extname(filePath);
  const directoryPath = path.dirname(filePath);
  const newFileName = `${fileName.replace(fileExtension, '')}_new${fileExtension}`;
  const newFilePath = path.join(directoryPath, newFileName);
  return newFilePath;
}


const compress = async (filePath, quality=50) => {
  const img = await sharp(filePath)
  const resultFilePath = addNewToFileName(filePath)

  // 像素调整为 2000
  img.resize(2000).jpeg({ quality: quality }).toFile(resultFilePath)
  console.log(`输出 ${resultFilePath}`)
}

// compress("C:\\Users\\21738\\Desktop\\新建文件夹\\1.jpg")
// compress("C:\\Users\\21738\\Desktop\\新建文件夹\\2.jpg")
// compress("C:\\Users\\21738\\Desktop\\新建文件夹\\3.jpg")
// compress("C:\\Users\\21738\\Desktop\\新建文件夹\\4.jpg")
compress("C:\\Users\\21738\\Desktop\\model\\b879a121.jpg")