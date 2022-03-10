
<script setup>
import toastr from 'toastr'
import { BigNumber, utils } from 'ethers'
import { startCountDown } from '@/logic/countdown.js'
import { formatAmount, getTokenSymbol, getQrcode, initClipboard, parseAmount, getTronWeb } from '@/utils/index'
import { OnTransferEvent } from '@/logic/transferEvent'
import { getBlockEvent } from '@/logic/scanBlock'
/*
  deadline: 1648614867
  pay_amount: "1200000"
  rec_address: "TMRhkH627BESu3K2QAJvxpUDR3k6a26NG8"
  rec_chain: "tron"
  uuid: "c16c5226-2c2e-4d0b-9281-4b0094bb080c"
*/
const urlSearchParams = new URLSearchParams(window.location.search)
const params = Object.fromEntries(urlSearchParams.entries())
const { pay_token, deadline, pay_amount, rec_address, rec_chain, uuid, out_order_no } = params

const checkFileds = ['pay_token', 'deadline', 'pay_amount', 'rec_address', 'rec_chain', 'uuid', 'out_order_no']
const isCheckParam = ref(Object.values(params).length !== 0)
for (const key of checkFileds) {
  if (params[key] === undefined || params[key] === null) {
    isCheckParam.value = false
    break
  }
}

// const pay_token = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'
// const deadline = new Date(Date.now() + 1800000).getTime() / 1000
// const pay_amount = '1'
// const rec_address = 'TMRhkH627BESu3K2QAJvxpUDR3k6a26NG8'
// const rec_chain = 'tron'
// const out_order_no = '123123'

const tokenName = ref()
const formatedAmount = ref()
const shortAddress = ref()
const qrcodeSrc = ref()

const { isOverTime, interval, minutes, seconds } = startCountDown(deadline * 1000)

const isComplete = ref(false)
const hasReceived = ref()
const hasReceivedShow = ref(0)
onMounted(async() => {
  console.log('isCheckParam', isCheckParam.value)
  if (isCheckParam.value) {
    shortAddress.value = `${rec_address.slice(0, 4)}...${rec_address.slice(-4)}`

    getTokenSymbol(pay_token).then(v => tokenName.value = v)

    getQrcode(rec_address).then(v => qrcodeSrc.value = v)

    const _amount = await parseAmount(pay_amount, pay_token)
    const hexAddress = (await getTronWeb()).address.toHex(rec_address).slice(2)// remove 41 prefix

    // deadline is absolute half an hour
    let startTime = (deadline * 1000 - 1800000).toString()
    startTime = `${startTime.slice(0, startTime.length - 4)}0000`
    async function transferEventHandler(sumAmount) {
      if (BigNumber.from(sumAmount).gte(_amount)) {
        console.log('pay success !')
        toastr.success('Pay success!', '', {
          positionClass: 'toast-top-center',
          timeOut: 0,
        })
        hasReceivedShow.value = await formatAmount(sumAmount, pay_token)
        clearInterval(interval)
        isComplete.value = true
      }
      else {
        hasReceived.value = sumAmount
        hasReceivedShow.value = await formatAmount(hasReceived.value, pay_token)
        setTimeout(() => {
          getBlockEvent(pay_token, hexAddress, startTime, transferEventHandler)
        }, 6000)
      }
    }
    getBlockEvent(pay_token, hexAddress, startTime, transferEventHandler)
  }
})

initClipboard('copyEl', () => {
  toastr.success(`${rec_address} Copy success!`, '', {
    positionClass: 'toast-top-center',
    timeOut: 2500,
  })
})

</script>
<template>
  <div class="area">
    <ul class="circles">
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
    </ul>
  </div>
  <div class="overlay"></div>
  <div v-if="isCheckParam" class="wrap">
    <div class="card-wrap">
      <div style="font-size: 18px" class="text-center">
        Order countdown
      </div>
      <div class="text-center countdown">
        <template v-if="!isComplete">
          <span>{{ minutes }}</span>
          <span style="font-size:16px">Min</span>
          <span>{{ seconds }}</span>
          <span style="font-size:16px">Sec</span>
        </template>
        <template v-else>
          Order Completed!
        </template>
      </div>
      <p>
        <span>Order Number：</span>
        <span>{{ out_order_no }}</span>
      </p>
      <p>
        <span>Amount：</span>
        <span>{{ pay_amount }} {{ tokenName }}( Not contains fee )</span>
      </p>
      <p>
        <span>Receiver：</span>
        <span class="flex items-center">
          <em class="font-normal">{{ shortAddress }}</em>
          <mdi-content-copy id="copyEl" class="ml-1" :value="rec_address" />
        </span>
      </p>
      <p>
        <span>Your pay：</span>
        <span>{{ hasReceivedShow }} {{ tokenName }}</span>
      </p>
      <p
        id="status"
        class="wait-text"
        :class="{ 'loading-dot': !isComplete }"
      >
        {{ isComplete ? 'Order Completed' : 'Waiting pay' }}
      </p>
      <div class="qrcode-wrap">
        <div class="qrcode">
          <img :src="qrcodeSrc" alt style="width: 160px" />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="wrap">
    Invalid Param
  </div>
</template>

<style lang="scss">
@import "../styles/index.scss";
@import "../styles/bg.css";
</style>
