import { getTronWeb } from '@/utils/index'

/**
 * @Desc:  {Bignumber} orderAmount
 * @Desc:  {base58Sting} toAddressHex
 */
export const OnTransferEvent = async function(tokenAdderss, toAddressHex, callback) {
  const tronWeb = await getTronWeb()
  // tronWeb.setHeader({ 'TRON-PRO-API-KEY': 'ce2d4035-a3cc-487e-90d5-c575b892f2d4' });
  tronWeb.contract().at(tokenAdderss).then((instance) => {
    instance.Transfer().watch((err, eventResult) => {
      if (err)
        return console.error('Error with "method" event:', err)

      if (eventResult) {
        console.log('eventResult:', eventResult)
        console.log(eventResult.result.to)
        console.log(eventResult.result.value)
        const toAddress = eventResult.result.to // hex
        const amount = eventResult.result.value // with decimals
        if (toAddress === toAddressHex)
          callback && callback(amount)
      }
    })
  })
}
