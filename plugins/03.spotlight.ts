// v-spotlight: lưới sáng và quầng xanh bám theo con trỏ.
// Ghi --mx/--my lên chính element; .grid-spot và .glow-spot đọc hai biến đó.
// Plugin phải universal: directive dùng trong template SSR bắt buộc có getSSRProps,
// nếu chỉ đăng ký ở client thì server-renderer sẽ đổ ở ssrGetDirectiveProps.
type SpotlightEl = HTMLElement & { _spotlight?: () => void }

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('spotlight', {
    getSSRProps: () => ({}),
    mounted(el: SpotlightEl) {
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${e.clientX - r.left}px`)
        el.style.setProperty('--my', `${e.clientY - r.top}px`)
      }
      const leave = () => {
        el.style.setProperty('--mx', '-999px')
        el.style.setProperty('--my', '-999px')
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      el._spotlight = () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    },
    unmounted(el: SpotlightEl) {
      el._spotlight?.()
    }
  })
})
