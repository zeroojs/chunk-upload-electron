<!--
 * @Descripttion: your project
 * @version: 0.0.0
 * @Author: Minyoung
 * @Date: 2022-03-13 15:04:33
 * @LastEditors: Minyoung
 * @LastEditTime: 2022-04-01 19:24:20
-->
<template>
  <div id="app">
    <div class="app-header">
      在上传设备浏览器中输入：<span class="link-style">{{ url }}</span>
    </div>
    <div class="container">
      <h4 v-show="list.length">已上传文件</h4>
      <div v-show="!list.length" class="empty-upload">
        还没有上传任何文件
      </div>
      <ul class="upload-list">
        <li
          v-for="item in list"
          :key="item"
          class="upload-list-item"
          @click="openFloder(item)"
        >
          {{ item }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ipcRenderer, remote } from 'electron'
import { watch, readdirSync } from 'fs'
import path from 'path'

const IS_BUILD = process.env.NODE_ENV === 'production'
let resourcePath = path.resolve(process.cwd(), './static/resources')
if (IS_BUILD) {
  resourcePath = path.resolve(process.cwd(), './resources/static/resources')
}

// 截流函数
const delay = (function() {
  let timer = 0
  return function(callback, ms) {
    clearTimeout(timer)
    timer = setTimeout(callback, ms)
  }
})()

let list = readdirSync(resourcePath, { encoding: 'utf-8' })
let cacheUrl = null
export default {
  name: 'App',
  data() {
    return {
      url: cacheUrl,
      list: list || []
    }
  },
  mounted() {
    ipcRenderer.send('asynchronous-message', { data: 'connect' })
    ipcRenderer.on('asynchronous-reply', (event, { url }) => {
      cacheUrl = url
      this.url = cacheUrl
    })
    watchSrouces.call(this)
  },
  methods: {
    openFloder(item) {
      remote.shell.showItemInFolder(path.join(resourcePath, item))
    }
  }
}

// 监听存储文件的文件夹变化
function watchSrouces() {
  watch(resourcePath, (e, file) => {
    delay(() => {
      const list = readdirSync(resourcePath, { encoding: 'utf-8' })
      this.list = list
    }, 500)
  })
}
</script>

<style>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

li {
  list-style: none;
}

#app {
  min-height: 100vh;
  padding: 20px;
}
.link-style {
  color: #6C63FF;
}

.app-header {
  border-bottom: 1px solid #6C63FF;
  padding-bottom: 5px;
}

.container {
  margin-top: 20px;
}

.empty-upload {
  margin-top: 10px;
  padding: 0 20px;
  color: #6C63FF;
  border: 1px dashed #6C63FF;
  border-radius: 10px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 上传列表 */
.upload-list {
  margin-top: 10px;
}
.upload-list-item {
  padding: 10px 50px 10px 10px;
  list-style-type: none;
  border-radius: 6px;
  border: 1px solid #6C63FF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  cursor: pointer;
  transition: .3s ease;
}
.upload-list-item:hover {
  background-color: rgba(108, 99, 255, .2);;
}
.upload-list-item ~ .upload-list-item {
  margin-top: 20px;
}
</style>
