const axios = require('axios')
const cheerio = require('cheerio')
const path = require('path')
const fs = require('fs')
const process = require('process');

class crawlData {
  constructor(base_url, referer) {
    this.base_url = base_url;
    this.referer = referer;
    this.result_list = [];
    this.storeDir = path.resolve('./', process.cwd())
  }

  async run() {
    try {
      await this.getPageData();
      await this.downLoadPictures();
      return this.storeDir
    } catch (e) {
      console.log(e);
      return false
    }
  }

  sleep(time) {
    return new Promise((resolve) => {
      // console.log(`自动睡眠中，${time / 1000}秒后重新发送请求......`);
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  async getPageData() {
    const target_url = this.base_url;
    try {
      const res = await axios.get(target_url);
      const html = res.data;
      const $ = cheerio.load(html);
      const result_list = [];

      // 根据店铺创建目录
      const today = new Date();
      const shopNickname = $('.showheader__nickname').text().replace(/[\/:*?"<>|]/g, "")
      const productName = $('.showalbumheader__gallerytitle').attr('data-name').replace(/[\/:*?"<>|]/g, "")
      this.storeDir = this.storeDir + '/' + `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}` + '/' + shopNickname + '/' + productName
      fs.mkdir(this.storeDir, { recursive: true }, function() {});

      $('.image__imagewrap img').each((_, element) => {
        result_list.push({
          download_url: 'https:' + $(element).attr('data-origin-src')
        })
      })
      this.result_list.push(...result_list);
      return Promise.resolve(result_list);
    } catch (e) {
      console.log('获取数据失败');
      return Promise.reject(e);
    }
  }

  async downLoadPictures() {
    const result_list = this.result_list;
    console.log(`共计 ${result_list.length} 张图片，正在下载，请稍等...`)
    try {
      for (let i = 0, len = result_list.length; i < len; i++) {
        const imageUrl = result_list[i].download_url;
        const targetPath = path.resolve(`${this.storeDir}/${imageUrl.split('/').pop()}`);

        if (fs.existsSync(targetPath)) {
          console.log('文件已存在，不再重复下载')
          continue
        } else {
          await this.downLoadPicture(imageUrl);
          console.log(`进度：${i + 1} / ${result_list.length}`);
          await this.sleep(500 * Math.random());
        }
      }
      console.log('原图已下载完成。');
      return Promise.resolve();
    } catch (e) {
      console.log('写入数据失败', e);
      return Promise.reject(e);
    }
  }

  async downLoadPicture(href) {
    try {
      const target_path = path.resolve(`${this.storeDir}/${href.split('/').pop()}`);
      const optionConf = {
        responseType: 'stream',
        headers: {
          "Referer": this.referer,
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"
        }
      }
      const response = await axios.get(href, optionConf);
      await response.data.pipe(fs.createWriteStream(target_path));
      // console.log('写入成功');
      return Promise.resolve();
    } catch (e) {
      console.log('写入数据失败');
      return Promise.reject(e);
    }
  }
}

module.exports = crawlData
