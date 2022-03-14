import { getTronWeb } from '@/utils/index'

/**
 * @Desc:  {Bignumber} orderAmount
 * @Desc:  {base58Sting} toAddressHex
 */
export const OnTransferEvent = async function(tokenAdderss, toAddressHex, callback) {
  const tronWeb = await getTronWeb()
  tronWeb.contract().at(tokenAdderss).then((instance) => {
    instance.Transfer().watch((err, eventResult) => {
      if (err)
        return console.error('Error with "method" event:', err)

      if (eventResult) {
        // console.log('eventResult:', eventResult)
        console.log(eventResult.result.to) // has '41' prefix
        console.log(eventResult.result.value)
        const toAddress = eventResult.result.to // hex
        const amount = eventResult.result.value // with decimals
        if (toAddress === toAddressHex){
          callback && callback(amount)
        }
      }
    })
  })
}
