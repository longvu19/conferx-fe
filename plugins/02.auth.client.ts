// Restore the signed-in session from the refresh cookie without blocking the first render.
export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['autoId'],
  setup() {
    useAuth().refresh()
  }
})
