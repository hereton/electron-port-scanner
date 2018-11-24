const $ = require('jquery')
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
      console.log(hosts)
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
      alert(error)
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
  let hosts = []
  let result = host.trim().split(',')
  console.log(result)
  result.map(async hostName => {
    console.log(hostName)
    if (hostName.includes('/')) {
      let subNetAndMask = hostName.split('/')
      let mask = subNetAndMask[1]
      let subNet = subNetAndMask[0].split('.')
      console.log('mask', mask)
      console.log('subnet', subNet)
      hosts = await subnetCal(parseInt(subNet[0]), parseInt(subNet[1]), parseInt(subNet[2]), parseInt(subNet[3]), parseInt(mask), hosts)
      // netMask = netMask.substring(0, parseInt(s[1])).replace(/0/g, '1') + netMask.substring(parseInt(s[1]), netMask.length)
      // let network = s[0]
      //   .split('.')
      //   .map((e, index) => {
      //     let a = ('00000000' + Number(e).toString(2)).slice(-8)
      //     // console.log('a', a)
      //     // console.log('netmask', netMask.substring(lastIndex, (index + 1) * 8))
      //     a = parseInt(a, 2) & parseInt(netMask.substring(lastIndex, (index + 1) * 8), 2)
      //     lastIndex = (index + 1) * 8

      //     return a
      //   })
      //   .join('.')
    } else {
      hosts.push(hostName)
    }
  })
  return hosts
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

function maskShift(mask, back = 0) {
  return ((Math.pow(2, mask) - 1) << (32 - mask)) >>> back
}

function printShift(num) {
  out = ''
  while (num != 0) {
    out = (num % 2) + out
    num = num >>> 1
  }

  if (out == '') {
    out = '0'
  }

  return out
}

// Input p1.p2.p3.p4/mask
function isValid(p1, p2, p3, p4, mask) {
  if (!Number.isInteger(p1) || !Number.isInteger(p2) || !Number.isInteger(p3) || !Number.isInteger(p4) || !Number.isInteger(mask)) {
    return false
  }
  if (p1 < 1 || p2 < 0 || p3 < 0 || p4 < 0 || mask < 8) {
    return false
  }
  return true
}

function subnetCal(p1, p2, p3, p4, mask, hosts) {
  console.log('subnet called', p1, p2, p3, p4, mask)
  if (!isValid(p1, p2, p3, p4, mask)) {
    return 'invalid ip format'
  }
  classMask = 0
  // Class A
  if (p1 > 0 && p1 <= 127) {
    classMask = 8
    // Class B
  } else if (p1 > 127 && p1 <= 191) {
    classMask = 16
    // Class C
  } else if (p1 > 191 && p1 <= 223) {
    classMask = 24
  } else {
    return 'Class D and E are not allowed'
  }

  if (mask < classMask) {
    return 'invalid ip format'
  }

  // Important: Don't delete `>>> 0` because it will cast signed int to unsigned int.
  ip = ((((p1 << 24) >>> 0) + ((p2 << 16) >>> 0) + ((p3 << 8) >>> 0) + p4) >>> 0) >>> 0

  netid = (ip & maskShift(classMask)) >>> (32 - classMask)
  subnetid = (ip & maskShift(mask - classMask, classMask)) >>> (32 - mask)
  hostid = (ip & maskShift(32 - mask, mask)) >>> 0

  console.log(printShift(netid) + ' ' + printShift(subnetid) + ' ' + printShift(hostid))
  if (hostid != 0) {
    return 'invalid subnet'
  }

  for (i = 0; i < Math.pow(2, 32 - mask) - 2; i++) {
    hostid = (hostid + 1) >>> 0
    res = ((netid << (32 - classMask)) >>> 0) + ((subnetid << (32 - mask)) >>> 0) + (hostid >>> 0)
    i1 = res >>> 24
    i2 = (res & maskShift(8, 8)) >>> 16
    i3 = (res & maskShift(8, 16)) >>> 8
    i4 = (res & maskShift(8, 24)) >>> 0
    hosts.push(i1 + '.' + i2 + '.' + i3 + '.' + i4)
  }

  return hosts
}
