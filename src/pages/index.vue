<script setup>
import toastr from 'toastr'
import { BigNumber, utils } from 'ethers'
import { formatAmount, getTokenSymbol, getQrcode, initClipboard, parseAmount, getTronWeb, formatToBlockTime } from '@/utils/index'
import { OnTransferEvent } from '@/logic/transferEvent'
import { getBlockEvent } from '@/logic/scanBlock'
import { QueryResult } from '@/logic/queryResult'
import moment from 'moment'

const $t = useI18n().t;

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
const create_time = ref()

const tokenName = ref()
const formatedAmount = ref()
const shortAddress = ref()
const qrcodeSrc = ref()

const isComplete = ref(false)
const hasReceived = ref(0)
const hasReceivedShow = ref(0)
const loaded = ref(false)


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

        shortAddress.value = `${rec_address.value.slice(0, 6)}...${rec_address.value.slice(-6)}`

        getTokenSymbol(pay_token.value).then(v => tokenName.value = v)

        getQrcode(rec_address.value).then(v => qrcodeSrc.value = v)

        initClipboard('copyEl', () => {
            toastr.success(`${$t('payAddress')}: ${rec_address.value} ${$t('copySuccess')}`, '', {
                positionClass: 'toast-top-center',
                timeOut: 2500,
            })
        })
        initClipboard('copyEl2', () => {
            toastr.success(`${$t('payAmount')}: ${pay_amount.value}USDT ${$t('copySuccess')}`, '', {
                positionClass: 'toast-top-center',
                timeOut: 2500,
            })
        })

        const _amount = await parseAmount(pay_amount.value, pay_token.value)
        const tronWeb = await getTronWeb()
        const hexAddress = tronWeb.address.toHex(rec_address.value)

        function queryCycle() {
            QueryResult(uuid.value).then(async data => {
                if (data.code == 0) {
                    loaded.value = true
                    create_time.value = moment(data.data.out_time).format('YYYY-MM-DD HH:mm:ss') // 创建时间
                }
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

    }
})

</script>


<template>
    <div class="loading-mask" v-if="!loaded">
        <eos-icons-loading class="w-36px h-36px text-white" />
    </div>
    <header class="flex mb-6">
        <img src="/public/logo.png" class="w-36px mr-1" alt />
        <span class="text-lg">CPay</span>
    </header>
    <div class="bg-white p-4 rounded-lg mb-2">
        <p class="flex justify-between text-sm mb-2 <iphone5:flex-wrap">
            <span class="<iphone5:w-full">{{ $t('orderNumber') }}:</span>
            <span>{{ out_order_no }}</span>
        </p>
        <p class="flex justify-between text-sm mb-2 <iphone5:flex-wrap">
            <span class="<iphone5:w-full">{{ $t('orderCreateTime') }}:</span>
            <span>{{ create_time }}</span>
        </p>
        <p class="flex justify-between text-sm <iphone5:flex-wrap">
            <span class="<iphone5:w-full">{{ $t('alreadyPay') }}:</span>
            <span>{{ hasReceivedShow }} USDT</span>
        </p>
    </div>
    <template v-if="loaded">
        <div class="bg-white p-4 rounded-lg mb-6">
            <p class="text-sm mb-2" v-if="!isComplete && !isOverTime">{{ $t('remainTime') }}：</p>
            <div class="text-center countdown text-3xl h-40px">
                <template v-if="!isComplete && !isOverTime">
                    <div style="color:#7b71fe;">
                        <span>{{ minutes }}</span>
                        <span style="font-size:16px">{{ $t('minutes') }}</span>
                        <span>{{ seconds }}</span>
                        <span style="font-size:16px">{{ $t('seconds') }}</span>
                    </div>
                </template>
                <template v-if="isComplete">{{ $t('orderComplete') }}!</template>
                <template v-else-if="isOverTime">{{ $t('expired') }}!</template>
            </div>
        </div>
        <template v-if="!isComplete && !isOverTime">
            <p
                class="flex items-baseline justify-center text-md cursor-pointer"
                id="copyEl2"
                :value="pay_amount"
            >
                {{ $t('needPay') }}：
                <span class="text-red-500 text-3xl">{{ pay_amount }}</span>
                <span class="ml-1">USDT</span>
                <mdi-content-copy class="ml-1" />
            </p>

            <div class="qrcode-wrap mb-4">
                <div class="qrcode">
                    <img :src="qrcodeSrc" alt style="width: 160px" />
                </div>
            </div>

            <p
                class="flex justify-center items-center flex-wrap cursor-pointer"
                id="copyEl"
                :value="rec_address"
            >
                <span class="md:hidden">{{ $t('payAddress') }}： {{ shortAddress }}</span>
                <span class="hidden md:block">{{ $t('payAddress') }}： {{ rec_address }}</span>
                <mdi-content-copy class="ml-1" />
            </p>
        </template>
    </template>
</template>

<style scoped lang="scss">
.qrcode-wrap {
    margin-top: 24px;
    display: flex;
    justify-content: center;
    .qrcode {
        padding: 12px;
        border: 1px solid #fff;
        border-radius: 8px;
        background-color: #fff;
    }
}
</style>