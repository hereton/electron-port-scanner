const $ = require('jquery')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

$(() => {
  $('#btnScan').on('click', async () => {
    const ip = $('#inputIP').val()
    const number = $('#inputNumber').val()

    console.log(ip, number)
    // $.get('ajax/test.html', function(data) {
    //   $('.result').html(data)
    //   alert('Load was performed.')
    // })
    ls()
  })

  $('#btnCancel').on('click', () => {
    alert('cancel')
  })
})

async function ls() {
  const { stdout, stderr } = await exec('ls')
  console.log('stdout:', stdout)
  console.log('stderr:', stderr)
}
