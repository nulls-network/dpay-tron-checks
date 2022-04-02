<script setup lang="ts">
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'CPay checkout',
  meta: [
    { name: 'description', content: 'CPay checkout for Tron' },
  ],
})

const {locale} = useI18n()
onMounted(()=>{
  const language = navigator.language.slice(0,2)
  if(language == 'zh'){
    locale.value = 'zh-CN'
  }
})

</script>

<template>
  <router-view />
</template>
