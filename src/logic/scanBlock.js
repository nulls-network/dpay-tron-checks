import { BigNumber } from 'ethers'

const baseHref = 'https://nile.trongrid.io'
/**
 * @Desc:  {number} startTime microseconds
 */
export async function getBlockEvent(tokenAdderss, toAddressHex, startTime, callback) {
  const options = { method: 'GET', headers: { Accept: 'application/json' } }

  const params = new URLSearchParams()
  params.append('event_name', 'Transfer')
  params.append('limit', '200')
  params.append('only_confirmed', true)
  params.append('min_block_timestamp', startTime)

  return fetch(`${baseHref}/v1/contracts/${tokenAdderss}/events?${params.toString()}`, options)
    .then(response => response.json())
    .then((response) => {
      const data = response.data.filter(item => item.result.to.slice(2) === toAddressHex)// remove 0x prefix
      //   console.log(response.data, data, toAddressHex)
      const amount = data.reduce((ac, curr) => {
        return BigNumber.from(ac).add(curr.result.value)
      }, 0)
      getBlockEvent.isFirst = false
      callback && callback(amount)
    })
    .catch(err => console.error(err))
}
getBlockEvent.isFirst = true
