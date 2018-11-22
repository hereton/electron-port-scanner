const $ = require('jquery')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const axios = require('axios')

$(() => {
  $('#btnScan').on('click', async () => {
    const ip = $('#inputIP').val()
    const number = $('#inputNumber').val()
    // loadTrigger()
    // console.log(ip, number)
    // const response = await axios.get('https://www.google.com')
    // console.log(response)
    // unLoadTrigger()
    // $('#responseData').html(`${response.data}`)
    await getNetwork()
  })
  $('#btnCancel').on('click', () => {
    alert('cancel')
  })
})

loadTrigger = () => {
  $('.loading').css({
    display: 'block'
  })
  $('.display').css({ opacity: '0.6', transition: '0.3s' })
}
unLoadTrigger = () => {
  $('.loading').css({
    display: 'none'
  })
  $('.display').css({ opacity: '1', transition: '0.3s' })
}

async function addElement(data) {
  $('.boxsizingBorder').append(data)
}

async function getNetwork() {
  let command = 'route get default | grep gateway'
  let stdout = await exec(command)
  console.log('stdout:', stdout)
  addElement(stdout.stdout.trim() + '\n')

  command = 'ipconfig getifaddr en0'
  stdout = await exec(command)
  console.log('stdout:', stdout.stdout)
  addElement(stdout.stdout.trim() + '\n')
}
