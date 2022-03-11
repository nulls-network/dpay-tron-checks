import { BigNumber } from 'ethers'
import { TronRPC } from '@/const'
import { formatToBlockTime } from '@/utils'

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
  params.append('max_block_timestamp', formatToBlockTime(+startTime + 1800000))
  const prevBlockNumber = getBlockEvent.prevBlockNumber
  const timestamp = getBlockEvent.timestamp
  if (prevBlockNumber && +startTime <= (+timestamp))
    params.append('block_number', prevBlockNumber)

  return fetch(`${TronRPC}/v1/contracts/${tokenAdderss}/events?${params.toString()}`, options)
    .then(response => response.json())
    .then((response) => {
      const data = response.data.filter(item => item.result.to.slice(2) === toAddressHex)// remove 0x prefix
      //   console.log(response.data, data, toAddressHex)
      const amount = data.reduce((ac, curr) => {
        return BigNumber.from(ac).add(curr.result.value)
      }, 0)
      getBlockEvent.prevBlockNumber = response.data[0]?.block_number - 20
      getBlockEvent.timestamp = response.data[0]?.block_timestamp
      callback && callback(amount)
    })
    .catch(err => console.error(err))
}
