const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const app = express()
const { json: parseJSON, urlencoded: parseUrlencoded } = require('body-parser')

const IS_BUILD = process.env.NODE_ENV === 'production'

const uploadMid = multer()
app.use(parseUrlencoded({ extended: false })) // 解析 application/x-www-form-urlencoded 格式的请求
app.use(parseJSON()) // 解析 application/json 格式的请求
app.use(cors())

let resourcePath = path.resolve(process.cwd(), './static/resources')
let tempPath = path.resolve(process.cwd(), './static/temp')
let requestPath = path.resolve(process.cwd(), './static/www/bundle.js')
let wwwPath = path.resolve(process.cwd(), './static/www')
if (IS_BUILD) {
  resourcePath = path.resolve(process.cwd(), './resources/static/resources')
  tempPath = path.resolve(process.cwd(), './resources/static/temp')
  requestPath = path.resolve(process.cwd(), './resources/static/www/bundle.js')
  wwwPath = path.resolve(process.cwd(), './resources/static/www')
}
app.use(express.static(wwwPath)) // 静态服务

app.get('/', (req, res) => {
  res.redirect('/index.html')
})

// 查询文件列表
app.get('/file-list', (req, res) => {
  const filesName = fs.readdirSync(resourcePath)
  res.send({ code: 1, data: filesName })
})

// 查询hash列表
app.get('/chunks', (req, res) => {
  const files = fs.readdirSync(resourcePath)
  res.send({
    code: 1,
    data: files
  })
})

// 上传临时存入
function saveTemp(file, filename) {
  const [hash] = filename.split('_')
  const fileTempFloder = path.join(tempPath, `./${hash}`)
  if (!fs.existsSync(fileTempFloder)) {
    fs.mkdirSync(fileTempFloder)
  }
  // 存入切片
  fs.writeFileSync(path.join(fileTempFloder, `./${filename}`), file.buffer)
}

// 上传
app.post('/upload', uploadMid.single('file'), (req, res) => {
  const file = req.file
  const filename = req.body.filename
  // fs.writeFileSync(path.join(resourcePath, `/${filename}`), file.buffer)
  // 将切片文件存到缓冲区
  // fs.writeFileSync(path.join(tempPath, `/${filename}`), file.buffer)
  saveTemp(file, filename)
  res.send({ code: 1 })
})

// 排序文件
function sortFiles(files = []) {
  const getFileIndex = file => {
    const [, index] = /_(\S*)\./.exec(file)
    return parseInt(index)
  }
  files = JSON.parse(JSON.stringify(files))
  const len = files.length
  let minIndex, temp
  for (let i = 0; i < len - 1; i++) {
    minIndex = i
    for (let j = i + 1; j < len; j++) {
      if (getFileIndex(files[j]) < getFileIndex(files[minIndex])) { // 寻找最小的数
        minIndex = j // 将最小数的索引保存
      }
    }
    temp = files[i]
    files[i] = files[minIndex]
    files[minIndex] = temp
  }
  return files
}

// 合并
function mergeFile(filename = '', hash = '') {
  // let files = fs.readdirSync(resourcePath)
  const singleTempFloder = path.join(tempPath, `./${hash}`)
  // let files = fs.readdirSync(tempPath)
  let files = fs.readdirSync(singleTempFloder)
  files = files.filter(file => file.indexOf(hash) !== -1)
  const filesBuffer = []
  files = sortFiles(files)
  files.forEach((item, index) => {
    const filePath = path.join(singleTempFloder, `./${item}`)
    const file = fs.readFileSync(filePath)
    filesBuffer.push(file)
    fs.unlinkSync(filePath)
  })
  // 删除临时目录
  fs.rmdirSync(singleTempFloder)
  const buffer = Buffer.concat(filesBuffer)
  const savePath = path.join(resourcePath, `./${filename}`)
  fs.writeFileSync(savePath, buffer)
}

app.post('/merge', (req, res) => {
  const { filename, hash } = req.body
  mergeFile(filename, hash)
  res.send({ code: 1, filename })
})

function getIPAdress() {
  const interfaces = require('os').networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address
      }
    }
  }
}

// 替换客户端的 BaseURL
function replaceBaseURL(url) {
  let requestContent = fs.readFileSync(requestPath, { encoding: 'utf-8' })
  requestContent = requestContent.replace('$baseURL', url)
  fs.writeFileSync(requestPath, requestContent, { encoding: 'utf-8' })
}

export default {
  run() {
    const PORT = 9528
    return new Promise(reslove => {
      app.listen(PORT, () => {
        const ip = getIPAdress()
        const url = `http://${ip}:${PORT}`
        console.log(`服务器已启动：${url}`)
        replaceBaseURL(url)
        reslove(url)
      })
    })
  }
}