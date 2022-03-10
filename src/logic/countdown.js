import { reactive, toRefs } from 'vue'
export const startCountDown = function(countDownDate) {
  const state = reactive({
    isOverTime: false,
    interval: null,
    minutes: '',
    seconds: '',
  })

  state.interval = setInterval(() => {
    const now = new Date().getTime()
    const distance = countDownDate - now
    // const days = Math.floor(distance / (1000 * 60 * 60 * 24))
    // const hours = Math.floor(
    //   (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    // )
    state.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    state.seconds = Math.floor((distance % (1000 * 60)) / 1000)
    if (state.seconds < 10)
      state.seconds = `0${state.seconds}`

    if (distance < 0) {
      clearInterval(state.interval)
      state.isOverTime = true
    }
  }, 1000)
  return {
    ...toRefs(state),
  }
}
