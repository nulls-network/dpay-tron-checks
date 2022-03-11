
<script setup>
import toastr from 'toastr'
import { BigNumber, utils } from 'ethers'
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

// const pay_token = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'
// const deadline = new Date(Date.now() + 1800000).getTime() / 1000
// const pay_amount = '1'
// const rec_address = 'TMRhkH627BESu3K2QAJvxpUDR3k6a26NG8'
// const rec_chain = 'tron'
// const out_order_no = '123123'

const pay_token = ref()
const deadline = ref()
const pay_amount = ref()
const rec_address = ref()
const rec_chain = ref()
const out_order_no = ref()
const uuid = ref()
const minutes = ref()
const seconds = ref()
const interval = ref()
const isOverTime = ref(false)
const isCheckParam = ref(false)

const tokenName = ref()
const formatedAmount = ref()
const shortAddress = ref()
const qrcodeSrc = ref()

const isComplete = ref(false)
const hasReceived = ref()
const hasReceivedShow = ref(0)

function startCountDown(countDownDate) {
  interval.value = setInterval(() => {
    const now = new Date().getTime()
    const distance = countDownDate - now
    // const days = Math.floor(distance / (1000 * 60 * 60 * 24))
    // const hours = Math.floor(
    //   (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    // )
    minutes.value = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    seconds.value = Math.floor((distance % (1000 * 60)) / 1000)
    if (seconds.value < 10)
      seconds.value = `0${seconds.value}`

    if (distance < 0) {
      clearInterval(interval.value)
      isOverTime.value = true
      console.log('overtime!')
    }
  }, 1000)
}

onMounted(async() => {
  const urlSearchParams = new URLSearchParams(window.location.search)
  const params = Object.fromEntries(urlSearchParams.entries())
  pay_token.value = params.pay_token
  deadline.value = params.deadline
  pay_amount.value = params.pay_amount
  rec_address.value = params.rec_address
  rec_chain.value = params.rec_chain
  uuid.value = params.uuid
  out_order_no.value = params.out_order_no

  const checkFileds = ['pay_token', 'deadline', 'pay_amount', 'rec_address', 'rec_chain', 'uuid', 'out_order_no']
  isCheckParam.value = Object.values(params).length !== 0
  for (const key of checkFileds) {
    if (params[key] === undefined || params[key] === null) {
      isCheckParam.value = false
      break
    }
  }

  console.log('isCheckParam', isCheckParam.value)
  if (isCheckParam.value) {
    startCountDown(deadline.value * 1000)

    shortAddress.value = `${rec_address.value.slice(0, 4)}...${rec_address.value.slice(-4)}`

    getTokenSymbol(pay_token.value).then(v => tokenName.value = v)

    getQrcode(rec_address.value).then(v => qrcodeSrc.value = v)

    initClipboard('copyEl', () => {
      toastr.success(`${rec_address.value} Copy success!`, '', {
        positionClass: 'toast-top-center',
        timeOut: 2500,
      })
    })

    const _amount = await parseAmount(pay_amount.value, pay_token.value)
    const hexAddress = (await getTronWeb()).address.toHex(rec_address.value).slice(2)// remove 41 prefix

    // deadline is absolute half an hour
    let startTime = (deadline.value * 1000 - 1800000).toString()
    startTime = `${startTime.slice(0, startTime.length - 4)}0000`
    async function transferEventHandler(sumAmount) {
      if (BigNumber.from(sumAmount).gte(_amount)) {
        console.log('pay success !')
        toastr.success('Pay success!', '', {
          positionClass: 'toast-top-center',
          timeOut: 0,
        })
        hasReceivedShow.value = await formatAmount(sumAmount, pay_token.value)
        clearInterval(interval)
        isComplete.value = true
      }
      else {
        hasReceived.value = sumAmount
        hasReceivedShow.value = await formatAmount(hasReceived.value, pay_token.value)
        setTimeout(() => {
          getBlockEvent(pay_token.value, hexAddress, startTime, transferEventHandler)
        }, 6000)
      }
    }
    getBlockEvent(pay_token.value, hexAddress, startTime, transferEventHandler)
  }
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
        <template v-if="!isComplete&&!isOverTime">
          <span>{{ minutes }}</span>
          <span style="font-size:16px">Min</span>
          <span>{{ seconds }}</span>
          <span style="font-size:16px">Sec</span>
        </template>
        <template v-else-if="isOverTime">
          Expired!
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
        <span>Already paid：</span>
        <span>{{ hasReceivedShow }} {{ tokenName }}</span>
      </p>
      <p
        v-if="!isOverTime"
        id="status"
        class="wait-text"
        :class="{ 'loading-dot': !isComplete }"
      >
        {{ isComplete ? 'Order Completed' : 'Waiting pay' }}
      </p>
      <p v-else class="wait-text">
        Order Expired
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
