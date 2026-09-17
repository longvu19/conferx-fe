import { joinURL } from 'ufo'

// Same-origin proxy to the APISIX gateway: avoids CORS and lets the HttpOnly
// refresh-token cookie work in the browser.
export default defineEventHandler((event) => {
  const { apiBase } = useRuntimeConfig(event)
  return proxyRequest(event, joinURL(apiBase, event.path))
})
