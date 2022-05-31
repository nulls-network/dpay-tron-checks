<script setup lang="ts">
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg

const $t = useI18n().t;
const { locale } = useI18n()

const title = useTitle()
title.value = `CPay ${$t('payCheckout')}`


onMounted(() => {
  const language = navigator.language.slice(0, 2)
  if (language == 'zh') {
    locale.value = 'zh-CN'
    title.value = `CPay ${$t('payCheckout')}`
  }
})

</script>

<template>
<el-config-provider :size="size" :z-index="zIndex">
  <router-view />
</el-config-provider>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { ElConfigProvider } from 'element-plus'

export default defineComponent({
  components: {
    ElConfigProvider,
  },
  setup() {
    return {
      zIndex: 3000,
      size: 'small',
    }
  },
})
</script>