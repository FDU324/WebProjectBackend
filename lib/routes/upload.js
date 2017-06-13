const express = require('express');
const router = express.Router();

const inspect = require('util').inspect;
const path = require('path');
const os = require('os');
const fs = require('fs');
const Busboy = require('busboy');

const host = "http:120.25.238.161:3000";

router.post('/uploadImg.json', function(req, res, next) {
    uploadImg(req).then(data => {
      res.send(data);
    }).catch(err => {
      console.log("err:",err);
      res.send('upload image error!')
    });
});


/**
 * 同步创建文件目录
 * @param  {string} dirname 目录绝对地址
 * @return {boolean}        创建目录结果
 */
function mkdirsSync( dirname ) {
  if (fs.existsSync( dirname )) {
    return true;
  } else {
    if (mkdirsSync( path.dirname(dirname)) ) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}

/**
 * 获取上传文件的后缀名
 * @param  {string} fileName 获取上传文件的后缀名
 * @return {string}          文件后缀名
 */
function getSuffixName( fileName ) {
  let nameList = fileName.split('.');
  return nameList[nameList.length - 1];
}

/**
 * 上传文件
 * @param  {object} req     koa上下文
 * * @param  {object} res     koa上下文
 * @return {promise}         
 */
function uploadImg(req) {
  
  let busboy = new Busboy({headers: req.headers})


  
  
  return new Promise((resolve, reject) => {
    console.log('文件上传中...');
    let result = {
      success: false,
      url: '',
    };

    // 获取类型
    let type = '';
    let filePath = '';
    let username = '';

    // 解析请求文件事件
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      if(filename == '') {
        resolve(result);
      }
      else{
        filePath = path.join(__dirname, '../../public/images',  type);
        let mkdirResult = mkdirsSync(filePath);
        let fileName_server = username + Date.now() + '.' + getSuffixName(filename);
        console.log(fileName_server);
        let _uploadFilePath = path.join(filePath, fileName_server);
        let saveTo = path.join(_uploadFilePath);

        // 文件保存到制定路径
        file.pipe(fs.createWriteStream(saveTo));

        // 文件写入事件结束
        file.on('end', function() {
          result.success = true;
          result.url = path.join(host, 'images', type, fileName_server);
          result.message = '文件上传成功';

          console.log('文件上传成功！');
          resolve(result)
        })
      }

    });

    // 解析表单中其他字段信息
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      console.log('表单字段数据 [' + fieldname + ']: value: ' + val);

      if(fieldname === 'type') {
        type = val;

      }
      else if(fieldname === 'username') {
        username = val;
      }

    });

    // 解析结束事件
    busboy.on('finish', function() {
      console.log('文件上传结束');
      resolve(result);
    });

    // 解析错误事件
    busboy.on('error', function(err) {
      console.log('文件上出错');
      reject(result);
    });

    req.pipe(busboy);
  })
    
}

export {router as upload};
