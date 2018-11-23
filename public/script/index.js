const $ = require('jquery')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const axios = require('axios')

let token
let refreshIntervalId
$(() => {
  $('#btnScan').on('click', async () => {
    await scan()
  })

  $('#btnCancel').on('click', async () => {
    const response = await axios.delete('http://localhost/api/token/' + token)
    clearInterval(refreshIntervalId)
    unLoadTrigger()
    alert('cancel')
  })

  $('#inputPorts').keypress(async e => {
    if (e.which == 13) {
      await scan()
    }
  })

  scan = async () => {
    try {
      const hosts = getHostArray($('#inputIPs').val())
      const wantedPort = getWantedPorts($('#inputPorts').val())
      console.log(wantedPort)
      const myJSON = createJSON(hosts, wantedPort)
      console.log(myJSON)
      loadTrigger()
      const postResponse = await axios.post('http://localhost/api/scan', myJSON)
      token = postResponse.data.token
      let finished = false
      refreshIntervalId = setInterval(async () => {
        if (finished) {
          clearInterval(refreshIntervalId)
          unLoadTrigger()
        } else {
          const getResponse = await axios.get('http://localhost/api/token/' + token)
          console.log(getResponse.data)
          await addElement(getResponse.data.results)
          finished = getResponse.data.results[getResponse.data.results.length - 1].finished
        }
      }, 2000)
    } catch (error) {
      alert('Error')
      unLoadTrigger()
    }
  }
})

loadTrigger = () => {
  $('.loading').css({
    display: 'block'
  })
  $('#btnCancel').removeAttr('disabled')
  $('#btnScan').attr('disabled', 'disabled')
}
unLoadTrigger = () => {
  $('.loading').css({
    display: 'none'
  })
  $('#btnScan').removeAttr('disabled')
  $('#btnCancel').attr('disabled', 'disabled')
}

getHostArray = host => {
  return host.trim().split(',')
}

createJSON = (hosts, wantedPort) => {
  let data = {
    targets: []
  }
  hosts.map(h => {
    data.targets.push({ address: h, ports: wantedPort })
  })
  return data
}

getWantedPorts = ports => {
  let wantedPort = []
  let rangePorts = []
  try {
    ports.split(',').map(port => {
      if (port.includes('-')) {
        rangePorts = port.split('-')
        console.log(rangePorts)

        Array(parseInt(rangePorts[1]) - parseInt(rangePorts[0]) + 1)
          .fill()
          .map((_, i) => {
            let p = parseInt(rangePorts[0]) + i
            if (!wantedPort.includes(p)) {
              wantedPort.push(p)
            }
          })
        // for (let p = parseInt(rangePorts[0]); p <= parseInt(rangePorts[1]); p++) {
        //   if (!wantedPort.includes(p)) {
        //     wantedPort.push(parseInt(p))
        //   }
        // }
      } else if (!wantedPort.includes(parseInt(port))) {
        console.log('else', port)
        wantedPort.push(parseInt(port))
      }
    })
    return wantedPort
  } catch (e) {
    return e
  }
}

async function addElement(data) {
  data.forEach(host => {
    if (host.ports.length >= 1) {
      host.ports.forEach(port => {
        $('#results').append(` 
        <div class="row">
          <div class="col-sm-3">${host.host}</div>
          <div class="col-sm-3">${host.ip}</div>
          <div class="col-sm-3">${port.port}</div>
          <div class="col-sm-3">${port.description}</div>
        </div>
        <hr>
        `)
      })
    }
  })
}
