
<script setup>
import toastr from 'toastr'
import { BigNumber, utils } from 'ethers'
import { formatAmount, getTokenSymbol, getQrcode, initClipboard, parseAmount, getTronWeb, formatToBlockTime } from '@/utils/index'
import { OnTransferEvent } from '@/logic/transferEvent'
import { getBlockEvent } from '@/logic/scanBlock'
import { QueryResult } from '@/logic/queryResult'

const $t = useI18n().t;
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
const hasReceived = ref(0)
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

onMounted(async () => {
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
      toastr.success(`${rec_address.value} ${$t('copySuccess')}!`, '', {
        positionClass: 'toast-top-center',
        timeOut: 2500,
      })
    })

    const _amount = await parseAmount(pay_amount.value, pay_token.value)
    const tronWeb = await getTronWeb()
    const hexAddress = tronWeb.address.toHex(rec_address.value)

    function queryCycle() {
      QueryResult(uuid.value).then(async data => {
        // payed:付款成功  submited：成交提交到链   finished：清洗数据完成
        if (!(data.code == 0 && data.data.status != 'success')) {
          setTimeout(() => {
            queryCycle()
          }, 3000);
        }
        else {
          hasReceivedShow.value = data.data.got_amount || 0

          if (+data.data.got_amount >= +pay_amount.value) {
            toastr.success(`${$t('paySuccess')}!`, '', {
              positionClass: 'toast-top-center',
              timeOut: 0,
            })
            clearInterval(interval)
            isComplete.value = true
          }
          else {
            setTimeout(() => {
              queryCycle()
            }, 3000);
          }
        }
      })
    }
    queryCycle()




    // async function transferEventHandler(amount) {
    //   if(hasReceived.value == 0){
    //     hasReceived.value = amount
    //   }
    //   else{
    //     hasReceived.value = BigNumber.from(amount).add(hasReceived.value)
    //   }
    //   if (BigNumber.from(amount).gte(_amount)) {
    //     console.log('pay success !')
    //     toastr.success('Pay success!', '', {
    //       positionClass: 'toast-top-center',
    //       timeOut: 0,
    //     })
    //     hasReceivedShow.value = await formatAmount(hasReceived.value, pay_token.value)
    //     clearInterval(interval)
    //     isComplete.value = true
    //   }
    // }
    // OnTransferEvent(pay_token.value,hexAddress,transferEventHandler)
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
      <div style="font-size: 18px" class="text-center">{{$t('orderCountdown')}}</div>
      <div class="text-center countdown">
        <template v-if="!isComplete && !isOverTime">
          <span>{{ minutes }}</span>
          <span style="font-size:16px">{{$t('minutes')}}</span>
          <span>{{ seconds }}</span>
          <span style="font-size:16px">{{$t('seconds')}}</span>
        </template>
        <template v-if="isComplete">{{$t('orderComplete')}}!</template>
        <template v-else-if="isOverTime">{{$t('expired')}}!</template>
      </div>
      <p>
        <span>{{$t('amount')}}：</span>
        <span> <em class="font-normal text-lg">{{ pay_amount }}</em> {{ tokenName }}( {{$t('noFee')}} )</span>
      </p>
      <p>
        <span>{{$t('receiver')}}：</span>
        <span class="flex items-center">
          <em class="font-normal">{{ shortAddress }}</em>
          <mdi-content-copy id="copyEl" class="ml-1" :value="rec_address" />
        </span>
      </p>
      <p>
        <span>{{$t('orderNumber')}}：</span>
        <span>{{ out_order_no }}</span>
      </p>
      <p>
        <span>{{$t('alreadyPay')}}：</span>
        <span>{{ hasReceivedShow }} {{ tokenName }}</span>
      </p>

      <p
        v-if="!isComplete && !isOverTime"
        id="status"
        class="wait-text"
        :class="{ 'loading-dot': !isComplete }"
      >{{ $t('waitPay') }}</p>
      <p v-if="isComplete" class="wait-text">{{$t('orderComplete')}}</p>
      <p v-else-if="isOverTime" class="wait-text">{{$t('expired')}}!</p>

      <div class="qrcode-wrap">
        <div class="qrcode">
          <img :src="qrcodeSrc" alt style="width: 160px" />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="wrap">{{$t('invaildParam')}}</div>
</template>

<style lang="scss">
@import "../styles/index.scss";
@import "../styles/bg.css";
</style>
