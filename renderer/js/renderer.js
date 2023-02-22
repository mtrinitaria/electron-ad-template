const form = document.querySelector('#img-form')
const img = document.querySelector('#img')
const outputPath = document.querySelector('#output-path')
const filename = document.querySelector('#filename')
const heightInput = document.querySelector('#height')
const widthInput = document.querySelector('#width')

// When done, show message
ipcRenderer.on('image:done', () =>
  alertSuccess(`Image resized to ${heightInput.value} x ${widthInput.value}`)
)

function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'green',
      color: 'white',
      textAlign: 'center',
    },
  })
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'red',
      color: 'white',
      textAlign: 'center',
    },
  })
}

document.getElementById('generate').addEventListener('click', () => {
  ipcRenderer.send('generate:ad', {
    dimensions: ['300x250', '728x90'],
    projectFolder: document.getElementById('project-folder').value.trim(),
    campaignName: document.getElementById('campaign-name').value.trim(),
    destDir: document.getElementById('dest-dir').value.trim(),
    adSizes: document.getElementById('ad-sizes').value.trim(),
  })
})

document.getElementById('preview').addEventListener('click', () => {
  ipcRenderer.send('preview:ad', {
    projectFolder: document.getElementById('project-folder').value.trim(),
    campaignName: document.getElementById('campaign-name').value.trim(),
    destDir: document.getElementById('dest-dir').value.trim(),
    adSizes: document.getElementById('ad-sizes').value.trim(),
  })
})

document.getElementById('all-zip').addEventListener('click', () => {
  console.log('allzip zip:ad')
  ipcRenderer.send('zip:ad', {
    projectFolder: document.getElementById('project-folder').value.trim(),
    campaignName: document.getElementById('campaign-name').value.trim(),
    destDir: document.getElementById('dest-dir').value.trim(),
    adSizes: document.getElementById('ad-sizes').value.trim(),
  })
})

document.getElementById('project-folder').addEventListener('click', () => {
  ipcRenderer.send('project-folder:open')
})

ipcRenderer.on('project-folder:close', (filePaths) => {
  console.log('filepaths', filePaths)
  document.getElementById('project-folder').value = filePaths
})

document.getElementById('dest-dir').addEventListener('click', () => {
  ipcRenderer.send('dest-dir:open')
})

ipcRenderer.on('dest-dir:close', (filePaths) => {
  console.log('filepaths', filePaths)
  document.getElementById('dest-dir').value = filePaths
})
