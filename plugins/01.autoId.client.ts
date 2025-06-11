import { uuidv7 } from 'uuidv7';
export default defineNuxtPlugin({
  name: 'autoId',
  enforce: 'pre',
  setup() {
    const autoId = localStorage.getItem('autoId') || uuidv7();
    localStorage.setItem('autoId', autoId.toString());
  }
})