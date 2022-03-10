import { utils } from 'ethers'
import QRCode from 'qrcode'
import ClipboardJS from 'clipboard'

export function getImg(name) {
  const path = `/src/assets/${name}`
  const modules = import.meta.globEager('/src/assets/*.(png|jpg|svg)')
  return modules[path].default
}

async function getTokenDecimal(tokenAdderss) {
  const tronWeb = await getTronWeb()
  const instance = await tronWeb.contract().at(tokenAdderss)
  return await instance.decimals().call()
}

export async function getTokenSymbol(tokenAdderss) {
  const tronWeb = await getTronWeb()
  const instance = await tronWeb.contract().at(tokenAdderss)
  return await instance.symbol().call()
}

export async function formatAmount(amount, token) {
  const decimals = await getTokenDecimal(token)
  return utils.formatUnits(amount, decimals)
}

export async function parseAmount(originAmount, token) {
  const decimals = await getTokenDecimal(token)
  console.log('decimals: ', decimals)

  let _amount = (+((+originAmount).toFixed(decimals))).toString()
  if (Number.isNaN(_amount))
    throw new Error('invaild amount')

  let _decimals = decimals
  const dLen = _amount.split('.')[1]?.length || 0
  if (dLen > 0) {
    _decimals -= dLen
    _amount = _amount.replace('.', '')
  }

  const amount = utils.parseUnits(_amount, _decimals).toString()
  console.log('parsed amount: ', originAmount, amount)
  return amount
}

export async function getTronWeb() {
  if (getTronWeb.tronWeb) return getTronWeb.tronWeb
  if (window)
    var TronWeb = (await import('tronweb/dist/TronWeb.js')).default

  // const rpc = 'https://api.trongrid.io';//production
  const rpc = 'https://nile.trongrid.io'
  const HttpProvider = TronWeb.providers.HttpProvider
  const fullNode = new HttpProvider(rpc)
  const solidityNode = new HttpProvider(rpc)
  const eventServer = new HttpProvider(rpc)
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer)
  tronWeb.setAddress('TLjg42ZBsEU161bBYorRR9yfve8EKTcZL9')// caller address for query token info
  // tronWeb.setHeader({ 'TRON-PRO-API-KEY': 'ce2d4035-a3cc-487e-90d5-c575b892f2d4' });
  getTronWeb.tronWeb = tronWeb
  return tronWeb
}

export const initClipboard = function(el, successFn) {
  // eslint-disable-next-line no-undef
  const clipboard = new ClipboardJS(`#${el}`, {
    text(trigger) {
      return trigger.getAttribute('value')
    },
  })
  clipboard.on('success', (e) => {
    successFn && successFn()
    e.clearSelection()
  })
}

export const getQrcode = function(str) {
  return new Promise((resolve) => {
    QRCode.toDataURL(
      str,
      {
        margin: 0,
      },
      (_err, url) => {
        resolve(url)
      },
    )
  })
}
