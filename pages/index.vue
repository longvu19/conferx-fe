<script setup lang="ts">
const roomCode: Ref<string | null> = ref(null)
const open = ref(false)
const checking = ref(false)
const api = useRoomApi()
const toast = useToast()

/** Only open the dialog for a meeting that still exists, so a dead code or link fails fast. */
const joinRoom = async (data: { roomCode: string }) => {
  if (checking.value) return
  checking.value = true
  try {
    const info = await api.getRoomInfo(data.roomCode)
    if (info.status === 'closed') {
      toast.add({
        title: 'This meeting has ended',
        description: 'Ask the host for a new link.',
        color: 'error',
        icon: 'i-lucide-phone-off'
      })
      return
    }
    roomCode.value = data.roomCode
    open.value = true
  } catch (e) {
    toast.add({
      title: 'Could not open that meeting',
      description: apiErrorMessage(e, 'Check the code and try again.'),
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
  } finally {
    checking.value = false
  }
}

const createRoom = () => {
  roomCode.value = null
  open.value = true
}

// Invite links and "Rejoin" land here as /?join=<room code>
const route = useRoute()
onMounted(() => {
  if (typeof route.query.join === 'string' && route.query.join) joinRoom({ roomCode: route.query.join })
})

const heroPoints = [
  'Guests join without an account',
  'Host approval and a password on every room',
  'Chat, screen share, and device check built in'
]

const heroMeta = [
  { k: 'SETUP', v: 'None' },
  { k: 'TIME LIMIT', v: 'None' },
  { k: 'PRICE', v: 'Free' }
]

// Khung sản phẩm ở hero. `photo` để null thì ô hiện bóng người thay thế;
// gán đường dẫn (ảnh nằm trong public/shot/) là ô tự chuyển sang ảnh thật,
// không phải sửa template. Xem docs/landing-shot-images.md.
// Tên phải khớp khuôn mặt trong ảnh, nếu không người xem nhận ra ngay. Ảnh đang dùng
// chỉ có một người Á Đông nên giữ tên Việt cho ô đó (đồng thời là ô đang nói), hai ô
// còn lại đặt tên quốc tế cho đúng người — cũng hợp với việc sản phẩm không giới hạn thị trường.
const shotTiles: { name: string, photo: string | null, fill: string, lit: boolean }[] = [
  { name: 'TRẦN HÀ', photo: '/shot/tran-ha.jpg', fill: 'linear-gradient(140deg,#16202e,#0b111a)', lit: true },
  { name: 'DANIEL REED', photo: '/shot/daniel-reed.jpg', fill: 'linear-gradient(140deg,#131a26,#0a0e15)', lit: false },
  { name: 'OMAR HADDAD', photo: '/shot/omar-haddad.jpg', fill: 'linear-gradient(140deg,#111826,#090d14)', lit: false }
]

const features = [
  { no: '01', title: 'Adaptive HD video', body: 'Quality tracks each connection so the call holds up on hotel wifi and fibre alike.', icon: 'm22 8-6 4 6 4V8Z', icon2: 'M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' },
  { no: '02', title: 'Encrypted media', body: 'Audio and video travel over DTLS-SRTP. Rooms are closed until you share the password.', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', icon2: 'M12 11v4' },
  { no: '03', title: 'Screen sharing', body: 'Present a screen, a window, or a tab. The stage rearranges around the presenter.', icon: 'M12 3v9m4-5-4-4-4 4', icon2: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7' },
  { no: '04', title: 'In-meeting chat', body: 'Messages everyone can see, gone the moment the meeting ends. No history to manage.', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z', icon2: 'M8 9h8M8 13h5' },
  { no: '05', title: 'Lobby control', body: 'Approve or deny each guest, or leave the door open to anyone with the password.', icon: 'M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M19 8v6M22 11h-6', icon2: 'M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' },
  { no: '06', title: 'Instant access', body: 'No download, no plugin, no waiting room for your own room. Open the link and talk.', icon: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z', icon2: 'M12 7v5l4 2' }
]

const security = [
  { no: '01', title: 'Password on every room', body: 'Guests need the meeting password; hosts keep a separate admin password for controls.' },
  { no: '02', title: 'You approve who enters', body: 'Turn on lobby approval and every guest waits until you let them in — one tap each.' },
  { no: '03', title: 'Remove anyone, end for all', body: 'Hosts can remove a participant or close the room for everyone in one action.' },
  { no: '04', title: 'Nothing outlives the call', body: 'No recordings, no stored chat. When the meeting ends, the room is gone.' }
]

const faqs = [
  { q: 'Do I need an account?', a: 'No. Guests only need the room code and the meeting password. An account is optional — it just keeps a list of your rooms so you can rejoin without the admin password.' },
  { q: 'Is there a time limit?', a: 'No. Rooms stay open as long as someone is in them, and the host can end the meeting for everyone at any time.' },
  { q: 'How many people can join?', a: 'Rooms are not capped by plan. The layout adapts from one tile to a full grid, and quality adjusts to each connection.' },
  { q: 'Is anything recorded?', a: 'Nothing is recorded or stored. Chat messages live only in the running meeting and disappear when it ends.' },
  { q: 'What do I need to install?', a: 'Nothing. ConferX runs in the browser you already have — open the link and you are in.' }
]
const openFaq = ref(0)
const toggleFaq = (i: number) => { openFaq.value = openFaq.value === i ? -1 : i }
</script>
<template>
  <div>
    <!-- Hero: copy bên trái, thẻ mở phiên bên phải -->
    <section class="pt-21">
      <div class="mx-auto grid max-w-360 items-start gap-16 px-6 sm:px-12 lg:grid-cols-[minmax(0,1fr)_560px]">
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full border border-signal-500/30 bg-signal-500/[.07] px-2.5 py-1.25 font-mono text-[11px] tracking-[.14em] text-signal-400">
            <span class="w-[5px] h-[5px] rounded-full bg-signal-500 animate-pulse-dot" />FREE · NO DOWNLOAD
          </div>
          <h2
            class="mt-5.5 text-[clamp(2.5rem,6vw,62px)] font-semibold leading-[1.03] tracking-[-.035em] text-display text-balance">
            A meeting room that opens<br class="hidden sm:inline">the moment you need it.
          </h2>
          <p class="mt-5.5 max-w-120 text-lg leading-[1.62] text-muted text-pretty">
            Create a room, send one link, and talk. Encrypted media, host approval, and no account required for guests.
          </p>
          <div class="mt-8.5 flex flex-col gap-3">
            <div v-for="p in heroPoints" :key="p" class="flex items-center gap-2.5 text-[15px] text-dim">
              <span class="flex-none flex items-center justify-center w-4 h-4 rounded-full border border-signal-500/50">
                <span class="w-[5px] h-[5px] rounded-full bg-signal-500" />
              </span>{{ p }}
            </div>
          </div>
        </div>

        <div
          class="card relative p-7 shadow-[0_40px_80px_-30px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.06)]">
          <!-- Vệt sáng chạy ngang mép trên -->
          <div class="absolute inset-x-6 top-0 h-px overflow-hidden">
            <div class="h-px w-1/3 animate-sweep bg-[linear-gradient(90deg,transparent,#4680ca,transparent)]" />
          </div>

          <div class="mb-5.5 flex items-center justify-between">
            <span class="font-mono text-[11px] tracking-[.14em] text-muted">START A SESSION</span>
            <span class="flex items-center gap-1.5 font-mono text-[11px] text-online">
              <span class="w-[5px] h-[5px] rounded-full bg-online" />SERVERS ONLINE
            </span>
          </div>

          <button type="button" class="btn-signal w-full rounded-xl py-4 text-base" @click="createRoom">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
              aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>
            Create conference room
          </button>

          <div class="my-5.5 flex items-center gap-3.5">
            <div class="h-px flex-1 bg-white/8" />
            <span class="font-mono text-[11px] tracking-[.12em] text-muted">OR JOIN</span>
            <div class="h-px flex-1 bg-white/8" />
          </div>

          <JoinRoomForm :checking="checking" @open-modal="joinRoom" />
          <RoomSettingsPopup v-model:open="open" :room-code="roomCode" />

          <div class="mt-5.5 flex gap-6 border-t border-white/7 pt-5">
            <div v-for="m in heroMeta" :key="m.k">
              <div class="font-mono text-[10px] tracking-[.14em] text-muted">{{ m.k }}</div>
              <div class="mt-1.25 text-sm text-dim">{{ m.v }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Ảnh sản phẩm: khung trình duyệt cắt nửa dưới -->
    <section class="pt-22">
      <div class="mx-auto max-w-360 px-6 sm:px-12">
        <div
          class="rounded-t-2xl border border-white/9 bg-[#090c12] p-3 pb-0 shadow-[0_-40px_120px_-40px_rgba(70,128,202,.3)]">
          <div class="flex items-center gap-2.5 px-2.5 pb-3.5 pt-1.5">
            <span class="flex gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#2a3140]" />
              <span class="w-2 h-2 rounded-full bg-[#2a3140]" />
              <span class="w-2 h-2 rounded-full bg-[#2a3140]" />
            </span>
            <span class="ml-2 font-mono text-[11px] text-muted">conferx.app/room/abc-defg-hij</span>
          </div>
          <div class="overflow-hidden rounded-t-[10px] border border-b-0 border-white/7">
            <div class="grid grid-cols-3 gap-2 bg-well p-2">
              <div v-for="(t, i) in shotTiles" :key="t.name"
                class="relative aspect-[16/10] overflow-hidden rounded-lg" :style="{
                  background: t.fill,
                  boxShadow: t.lit
                    ? 'inset 0 0 0 1px rgba(255,255,255,.06), 0 0 0 1px #4680ca66, 0 0 24px -6px #4680ca80'
                    : 'inset 0 0 0 1px rgba(255,255,255,.06)'
                }">
                <!-- Có ảnh thật: chỉnh màu về bảng deep space rồi phủ một lớp ám xanh mỏng. -->
                <template v-if="t.photo">
                  <!-- Lưới luôn 3 cột nên ô luôn chiếm ~1/3 bề ngang. `sizes` phải có tiền tố
                       breakpoint thì Nuxt Image mới dựng được srcset (giá trị trần cho ra `0w`).
                       Trần trên là 440px: nhân densities x2 vừa đúng 880px — bằng ảnh gốc, nên
                       không bao giờ phóng to lên. -->
                  <!-- Chỉ một lớp chỉnh màu duy nhất: filter .feed-photo trên chính ảnh.
                       Không còn div overlay đè lên trên — hai lớp cộng dồn từng làm ảnh bị tối. -->
                  <NuxtImg :src="t.photo" :alt="`${t.name} trong một cuộc họp ConferX`" width="440" height="275"
                    format="webp" sizes="xs:100vw md:33vw lg:440px" densities="x1 x2"
                    :loading="i === 0 ? 'eager' : 'lazy'"
                    class="feed-photo absolute inset-0 h-full w-full object-cover" />
                </template>

                <!-- Chưa có ảnh: bóng người mờ + vân chéo để lấp ô trống.
                     Vân chéo chỉ dùng ở đây — phủ lên ảnh thật thì chỉ làm đục ảnh. -->
                <template v-else>
                  <svg class="absolute inset-0 h-full w-full" viewBox="0 0 160 100"
                    preserveAspectRatio="xMidYMax slice" aria-hidden="true">
                    <ellipse cx="80" cy="64" rx="46" ry="34" fill="#4680ca" opacity=".05" />
                    <circle cx="80" cy="48" r="14" fill="#9cc6f7" opacity=".10" />
                    <path d="M80 65c-16 0-28 10-31 25h62c-3-15-15-25-31-25Z" fill="#9cc6f7" opacity=".10" />
                  </svg>
                  <div
                    class="absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(255,255,255,.035)_0_2px,transparent_2px_9px)]" />
                </template>

                <span
                  class="absolute bottom-2.5 left-2.5 rounded-md border border-white/7 bg-[rgba(4,6,10,.7)] px-2 py-1 font-mono text-[11px] text-dim">{{ t.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tính năng -->
    <section id="features" class="scroll-mt-20 pt-24">
      <div class="mx-auto max-w-360 px-6 sm:px-12">
        <div class="mb-9 flex flex-wrap items-end justify-between gap-10">
          <div>
            <div class="eyebrow">01 / WHAT YOU GET</div>
            <h3 class="mt-3.5 text-[38px] font-semibold leading-[1.15] tracking-[-.025em]">
              Everything a meeting needs.<br class="hidden sm:inline">Nothing it doesn't.
            </h3>
          </div>
          <p class="max-w-80 text-[15px] leading-[1.6] text-muted">
            No plans, no seat counts, no install step. Open a room and it works in the browser you already have.
          </p>
        </div>
        <div class="grid gap-px overflow-hidden rounded-2xl border border-white/[.075] bg-white/[.075] sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="f in features" :key="f.no" class="bg-panel px-6.5 pb-7.5 pt-7 transition-colors hover:bg-lift">
            <div class="flex items-center justify-between">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-[9px] border border-signal-500/30 bg-signal-500/10 text-signal-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                  aria-hidden="true"><path :d="f.icon" /><path :d="f.icon2" /></svg>
              </span>
              <span class="font-mono text-[11px] text-muted">{{ f.no }}</span>
            </div>
            <h4 class="mb-2 mt-5 text-[17px] font-semibold text-ink">{{ f.title }}</h4>
            <p class="text-sm leading-[1.6] text-muted">{{ f.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Band 02 — Bảo mật. Tràn viền, dính liền band 03 bên dưới. -->
    <section id="security" class="relative mt-28 scroll-mt-20 overflow-hidden border-t border-white/6 bg-abyss py-22">
      <div
        class="pointer-events-none absolute -right-30 -top-35 h-105 w-155 bg-[radial-gradient(ellipse_at_center,rgba(78,168,122,.12),rgba(78,168,122,0)_68%)]" />

      <div class="relative mx-auto max-w-360 px-6 sm:px-12">
        <div class="mx-auto flex max-w-170 flex-col items-center text-center">
          <div class="eyebrow">02 / SECURITY</div>
          <h3 class="mt-4 text-[44px] font-semibold leading-[1.1] tracking-[-.03em]">Private by default.</h3>
          <p class="mt-4 text-[17px] leading-[1.65] text-muted">
            Every room stays closed until you hand out the password, and you decide who crosses the door. Nothing about
            the meeting outlives it.
          </p>
          <div class="mt-6 inline-flex items-center gap-2 font-mono text-[11px] tracking-[.1em] text-online">
            <span class="w-[5px] h-[5px] rounded-full bg-online animate-pulse-dot" />DTLS-SRTP ENCRYPTED MEDIA
          </div>
        </div>
        <div class="mx-auto mt-14 grid max-w-275 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="s in security" :key="s.no" class="border-t-2 border-signal-500/45 pt-5.5">
            <div class="font-mono text-[28px] tracking-[-.02em] text-signal-500">{{ s.no }}</div>
            <div class="mt-3.5 text-[17px] font-semibold text-ink">{{ s.title }}</div>
            <p class="mt-2 text-sm leading-[1.65] text-muted">{{ s.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ trên tấm kính lỏng -->
    <!-- Band 03 — cả dải là kính lỏng, không phải card. Dính liền band 02 qua hairline của .glass-band. -->
    <section id="faq" class="relative scroll-mt-20 overflow-hidden py-22">
      <!-- Bloom nằm DƯỚI tấm kính: không có nó thì blur không có gì để khúc xạ. -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          class="absolute left-[14%] top-[6%] h-72 w-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(70,128,202,.3),transparent_70%)] blur-3xl" />
        <div
          class="absolute right-[10%] top-[44%] h-64 w-[34%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(78,168,122,.16),transparent_70%)] blur-3xl" />
      </div>

      <!-- Mặt kính phủ trọn dải, tràn hết chiều ngang màn hình. -->
      <div class="glass-band pointer-events-none absolute inset-0" aria-hidden="true" />

      <div class="relative mx-auto max-w-360 px-6 sm:px-12">
        <div class="grid gap-14 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <div class="eyebrow">03 / FAQ</div>
            <h3 class="mt-3.5 text-[34px] font-semibold leading-[1.15] tracking-[-.025em]">Questions,<br>answered.</h3>
          </div>
          <div class="border-t border-white/12">
            <div v-for="(q, i) in faqs" :key="q.q" class="border-b border-white/12">
              <button type="button" :aria-expanded="openFaq === i"
                class="flex w-full cursor-pointer items-center gap-5 bg-transparent px-1 py-5.5 text-left transition-colors hover:text-display"
                @click="toggleFaq(i)">
                <span class="flex-1 text-[17px] font-medium text-ink">{{ q.q }}</span>
                <span class="flex-none font-mono text-base text-signal-400">{{ openFaq === i ? '−' : '+' }}</span>
              </button>
              <p v-if="openFaq === i" class="px-1 pb-6 pr-15 text-[15px] leading-[1.68] text-dim">{{ q.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Chốt -->
    <section class="pt-26">
      <div class="mx-auto max-w-360 px-6 sm:px-12">
        <div
          class="relative overflow-hidden rounded-2xl border border-signal-500/28 bg-[#0a0e15] bg-[image:radial-gradient(ellipse_at_50%_140%,rgba(70,128,202,.22),rgba(70,128,202,0)_70%)] p-16 text-center">
          <h3 class="text-[40px] font-semibold leading-[1.1] tracking-[-.03em]">Open a room. Send the link.</h3>
          <p class="mx-auto mb-7.5 mt-4 max-w-110 text-base leading-[1.6] text-muted">
            That's the whole product. Free, in the browser, for as long as you need.
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <button type="button" class="btn-signal rounded-xl px-6.5 py-3.5 text-[15px]" @click="createRoom">
              Create conference room
            </button>
            <a href="#features" class="btn-ghost rounded-xl px-6.5 py-3.5 text-[15px] text-ink">See how it works</a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
