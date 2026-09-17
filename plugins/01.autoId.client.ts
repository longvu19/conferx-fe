import { uuidv7 } from 'uuidv7';

// Anonymous, per-browser user id used until accounts exist.
export default defineNuxtPlugin({
  name: 'autoId',
  enforce: 'pre',
  setup() {
    let autoId: string | null = null;
    try {
      autoId = localStorage.getItem('autoId');
      if (!autoId) {
        autoId = uuidv7();
        localStorage.setItem('autoId', autoId);
      }
    } catch {
      // Storage disabled (private mode): keep an id for this tab only.
      autoId = uuidv7();
    }
    useState('identity:user-id', () => autoId as string);
  }
})
