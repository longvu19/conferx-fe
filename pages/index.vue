<script setup lang="ts">
import type {
  ISourceOptions as ParticlesOptions,
  Container as ParticlesContainer
} from '@tsparticles/engine'
const options: ParticlesOptions = {
  "autoPlay": true,
  "backgroundMask": {
    "composite": "destination-out",
    "cover": {
      "opacity": 1,
      "color": {
        "value": ""
      }
    },
    "enable": false
  },
  "clear": true,
  "delay": 0,
  "fullScreen": {
    "enable": true,
    "zIndex": 0
  },
  "detectRetina": true,
  "duration": 0,
  "interactivity": {
    "detectsOn": "window",
    "events": {
      "onClick": {
        "enable": false,
        "mode": "repulse"
      },
      "onDiv": {
        "selectors": {},
        "enable": false,
        "mode": {},
        "type": "circle"
      },
      "onHover": {
        "enable": true,
        "mode": "bubble",
        "parallax": {
          "enable": false,
          "force": 2,
          "smooth": 10
        }
      },
      "resize": {
        "delay": 0.5,
        "enable": true
      }
    },
    "modes": {
      "trail": {
        "delay": 1,
        "pauseOnStop": false,
        "quantity": 1
      },
      "attract": {
        "distance": 200,
        "duration": 0.4,
        "easing": "ease-out-quad",
        "factor": 1,
        "maxSpeed": 50,
        "speed": 1
      },
      "bounce": {
        "distance": 200
      },
      "bubble": {
        "distance": 250,
        "duration": 2,
        "mix": false,
        "opacity": 0,
        "size": 0,
        "divs": {
          "distance": 200,
          "duration": 0.4,
          "mix": false,
          "selectors": {}
        }
      },
      "connect": {
        "distance": 80,
        "links": {
          "opacity": 0.5
        },
        "radius": 60
      },
      "grab": {
        "distance": 400,
        "links": {
          "blink": false,
          "consent": false,
          "opacity": 1
        }
      },
      "push": {
        "default": true,
        "groups": [],
        "quantity": 4
      },
      "remove": {
        "quantity": 2
      },
      "repulse": {
        "distance": 400,
        "duration": 0.4,
        "factor": 100,
        "speed": 1,
        "maxSpeed": 50,
        "easing": "ease-out-quad",
        "divs": {
          "distance": 200,
          "duration": 0.4,
          "factor": 100,
          "speed": 1,
          "maxSpeed": 50,
          "easing": "ease-out-quad",
          "selectors": {}
        }
      },
      "slow": {
        "factor": 3,
        "radius": 200
      },
      "particle": {
        "replaceCursor": false,
        "pauseOnStop": false,
        "stopDelay": 0
      },
      "light": {
        "area": {
          "gradient": {
            "start": {
              "value": "#ffffff"
            },
            "stop": {
              "value": "#000000"
            }
          },
          "radius": 1000
        },
        "shadow": {
          "color": {
            "value": "#000000"
          },
          "length": 2000
        }
      }
    }
  },
  "particles": {
    "bounce": {
      "horizontal": {
        "value": 1
      },
      "vertical": {
        "value": 1
      }
    },
    "collisions": {
      "absorb": {
        "speed": 2
      },
      "bounce": {
        "horizontal": {
          "value": 1
        },
        "vertical": {
          "value": 1
        }
      },
      "enable": false,
      "maxSpeed": 50,
      "mode": "bounce",
      "overlap": {
        "enable": true,
        "retries": 0
      }
    },
    "color": {
      "value": "#ffffff",
      "animation": {
        "h": {
          "count": 0,
          "enable": false,
          "speed": 1,
          "decay": 0,
          "delay": 0,
          "sync": true,
          "offset": 0
        },
        "s": {
          "count": 0,
          "enable": false,
          "speed": 1,
          "decay": 0,
          "delay": 0,
          "sync": true,
          "offset": 0
        },
        "l": {
          "count": 0,
          "enable": false,
          "speed": 1,
          "decay": 0,
          "delay": 0,
          "sync": true,
          "offset": 0
        }
      }
    },
    "effect": {
      "close": true,
      "fill": true,
    },
    "move": {
      "angle": {
        "offset": 0,
        "value": 90
      },
      "attract": {
        "distance": 200,
        "enable": false,
        "rotate": {
          "x": 3000,
          "y": 3000
        }
      },
      "center": {
        "x": 50,
        "y": 50,
        "mode": "percent",
        "radius": 0
      },
      "decay": 0,
      "distance": {},
      "direction": "none",
      "drift": 0,
      "enable": true,
      "gravity": {
        "acceleration": 9.81,
        "enable": false,
        "inverse": false,
        "maxSpeed": 50
      },
      "path": {
        "clamp": true,
        "delay": {
          "value": 0
        },
        "enable": false,
        "options": {}
      },
      "outModes": {
        "default": "out",
        "bottom": "out",
        "left": "out",
        "right": "out",
        "top": "out"
      },
      "random": false,
      "size": false,
      "speed": {
        "min": 0.1,
        "max": 0.2
      },
      "spin": {
        "acceleration": 0,
        "enable": false
      },
      "straight": false,
      "trail": {
        "enable": false,
        "length": 10,
        "fill": {}
      },
      "vibrate": false,
      "warp": false
    },
    "number": {
      "density": {
        "enable": false,
        "width": 1920,
        "height": 1080
      },
      "limit": {
        "mode": "delete",
        "value": 0
      },
      "value": 160
    },
    "opacity": {
      "value": {
        "min": 0.1,
        "max": 1
      },
      "animation": {
        "count": 0,
        "enable": true,
        "speed": 1,
        "decay": 0,
        "delay": 0,
        "sync": false,
        "mode": "auto",
        "startValue": "random",
        "destroy": "none"
      }
    },
    "reduceDuplicates": false,
    "shadow": {
      "blur": 0,
      "color": {
        "value": "#000"
      },
      "enable": false,
      "offset": {
        "x": 0,
        "y": 0
      }
    },
    "shape": {
      "close": true,
      "fill": true,
      "options": {},
      "type": "circle"
    },
    "size": {
      "value": {
        "min": 1,
        "max": 3
      },
      "animation": {
        "count": 0,
        "enable": false,
        "speed": 5,
        "decay": 0,
        "delay": 0,
        "sync": false,
        "mode": "auto",
        "startValue": "random",
        "destroy": "none"
      }
    },
    "stroke": {
      "width": 0
    },
    "zIndex": {
      "value": 0,
      "opacityRate": 1,
      "sizeRate": 1,
      "velocityRate": 1
    },
    "destroy": {
      "bounds": {},
      "mode": "none",
      "split": {
        "count": 1,
        "factor": {
          "value": 3
        },
        "rate": {
          "value": {
            "min": 4,
            "max": 9
          }
        },
        "sizeOffset": true,
        "particles": {}
      }
    },
    "roll": {
      "darken": {
        "enable": false,
        "value": 0
      },
      "enable": false,
      "enlighten": {
        "enable": false,
        "value": 0
      },
      "mode": "vertical",
      "speed": 25
    },
    "tilt": {
      "value": 0,
      "animation": {
        "enable": false,
        "speed": 0,
        "decay": 0,
        "sync": false
      },
      "direction": "clockwise",
      "enable": false
    },
    "twinkle": {
      "lines": {
        "enable": false,
        "frequency": 0.05,
        "opacity": 1
      },
      "particles": {
        "enable": false,
        "frequency": 0.05,
        "opacity": 1
      }
    },
    "wobble": {
      "distance": 5,
      "enable": false,
      "speed": {
        "angle": 50,
        "move": 10
      }
    },
    "life": {
      "count": 0,
      "delay": {
        "value": 0,
        "sync": false
      },
      "duration": {
        "value": 0,
        "sync": false
      }
    },
    "rotate": {
      "value": 0,
      "animation": {
        "enable": false,
        "speed": 0,
        "decay": 0,
        "sync": false
      },
      "direction": "clockwise",
      "path": false
    },
    "orbit": {
      "animation": {
        "count": 0,
        "enable": false,
        "speed": 1,
        "decay": 0,
        "delay": 0,
        "sync": false
      },
      "enable": false,
      "opacity": 1,
      "rotation": {
        "value": 45
      },
      "width": 1
    },
    "links": {
      "blink": false,
      "color": {
        "value": "#fff"
      },
      "consent": false,
      "distance": 100,
      "enable": false,
      "frequency": 1,
      "opacity": 1,
      "shadow": {
        "blur": 5,
        "color": {
          "value": "#000"
        },
        "enable": false
      },
      "triangles": {
        "enable": false,
        "frequency": 1
      },
      "width": 1,
      "warp": false
    },
    "repulse": {
      "value": 0,
      "enabled": false,
      "distance": 1,
      "duration": 1,
      "factor": 1,
      "speed": 1
    }
  },
  "pauseOnOutsideViewport": true,
  "responsive": [],
  "smooth": true,
  "zLayers": 100,
  "key": "nasa",
  "name": "NASA",
  "motion": {
    "disable": false,
    "reduce": {
      "factor": 4,
      "value": true
    }
  }
}
const open = ref(false);
const onLoad = (container: ParticlesContainer) => {
  // Do something with the container
  container.play()
}
</script>
<template>
  <div>
    <section class="text-center relative overflow-hidden">
      <NuxtParticles id="tsparticles" class="absolute inset-0 z-0" :options="options" @load="onLoad" />
      <LogoHeader />

      <div class="relative z-1 pt-30 pb-15 ">
        <h2 class="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Connect. Collaborate. Create.
        </h2>
        <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Host secure video conferences with crystal-clear quality. Join meetings instantly or create your own room in
          seconds.
        </p>
        <div id="conference-actions" class="max-w-md mx-auto space-y-6 mb-20">
          <button
            class="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-normal py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-600/25 hover:cursor-pointer" @click="open = true">
            <svg width="14" height="16" class="svg-inline--fa fa-plus" aria-hidden="true" data-prefix="fas" data-icon="plus"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path fill="currentColor"
                d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z" />
            </svg>
            <span>Create Conference Room</span>
          </button>
          <USeparator label="or" />
          <JoinRoomForm @open-modal="open = true" />
          <RoomSettingsPopup v-model:open="open" />
        </div>
      </div>
    </section>

    <section class="py-20 bg-black/50">
      <h3 class="text-3xl font-bold mb-4 text-center">Why Choose ConferX?</h3>
      <p class="text-gray-300 text-lg text-center">Powerful features designed for modern collaboration</p>
      <UContainer>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <!-- Benefit 1 -->
          <div id="benefit-1"
            class="bg-zinc-700/20 p-6 rounded-xl border border-gray-600 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
            <div class="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <i class="text-blue-400 text-xl" data-fa-i2svg=""><svg width="24" height="24"
                  class="svg-inline--fa fa-video" aria-hidden="true" focusable="false" data-prefix="fas"
                  data-icon="video" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"
                  data-fa-i2svg="">
                  <path fill="currentColor"
                    d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2V384c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1V320 192 174.9l14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z" />
                </svg></i>
            </div>
            <h4 class="text-xl font-semibold mb-3">HD Video Quality</h4>
            <p class="text-gray-400">Crystal-clear video calls with adaptive quality that adjusts to your connection.
            </p>
          </div>

          <!-- Benefit 2 -->
          <div id="benefit-2"
            class="bg-zinc-700/20 p-6 rounded-xl border border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
              <i class="text-purple-400 text-xl" data-fa-i2svg=""><svg width="24" height="24"
                  class="svg-inline--fa fa-shield-halved" aria-hidden="true" focusable="false" data-prefix="fas"
                  data-icon="shield-halved" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
                  data-fa-i2svg="">
                  <path fill="currentColor"
                    d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8V444.8C394 378 431.1 230.1 432 141.4L256 66.8l0 0z" />
                </svg></i>
            </div>
            <h4 class="text-xl font-semibold mb-3">End-to-End Security</h4>
            <p class="text-gray-400">Your conversations are protected with enterprise-grade encryption and security.
            </p>
          </div>

          <!-- Benefit 3 -->
          <div id="benefit-3"
            class="bg-zinc-700/20 p-6 rounded-xl border border-gray-600 hover:border-green-500/50 hover:bg-green-500/5 transition-all">
            <div class="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
              <i class="text-green-400 text-xl" data-fa-i2svg=""><svg width="24" height="24"
                  class="svg-inline--fa fa-users" aria-hidden="true" focusable="false" data-prefix="fas"
                  data-icon="users" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"
                  data-fa-i2svg="">
                  <path fill="currentColor"
                    d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z" />
                </svg></i>
            </div>
            <h4 class="text-xl font-semibold mb-3">Unlimited Participants</h4>
            <p class="text-gray-400">Host meetings with unlimited participants without compromising quality.</p>
          </div>

          <!-- Benefit 4 -->
          <div id="benefit-4"
            class="bg-zinc-700/20 p-6 rounded-xl border border-gray-600 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all">
            <div class="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center mb-4">
              <i class="text-orange-400 text-xl" data-fa-i2svg=""><svg width="24" height="24"
                  class="svg-inline--fa fa-share-nodes" aria-hidden="true" focusable="false" data-prefix="fas"
                  data-icon="share-nodes" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"
                  data-fa-i2svg="">
                  <path fill="currentColor"
                    d="M352 224c53 0 96-43 96-96s-43-96-96-96s-96 43-96 96c0 4 .2 8 .7 11.9l-94.1 47C145.4 170.2 121.9 160 96 160c-53 0-96 43-96 96s43 96 96 96c25.9 0 49.4-10.2 66.6-26.9l94.1 47c-.5 3.9-.7 7.8-.7 11.9c0 53 43 96 96 96s96-43 96-96s-43-96-96-96c-25.9 0-49.4 10.2-66.6 26.9l-94.1-47c.5-3.9 .7-7.8 .7-11.9s-.2-8-.7-11.9l94.1-47C302.6 213.8 326.1 224 352 224z" />
                </svg></i>
            </div>
            <h4 class="text-xl font-semibold mb-3">Screen Sharing</h4>
            <p class="text-gray-400">Share your screen, applications, or specific windows with ease.</p>
          </div>

          <!-- Benefit 5 -->
          <div id="benefit-5"
            class="bg-zinc-700/20 p-6 rounded-xl border border-gray-600 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all">
            <div class="w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center mb-4">
              <i class="text-pink-400 text-xl" data-fa-i2svg=""><svg width="24" height="24"
                  class="svg-inline--fa fa-comments" aria-hidden="true" focusable="false" data-prefix="fas"
                  data-icon="comments" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"
                  data-fa-i2svg="">
                  <path fill="currentColor"
                    d="M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2 0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.3-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9l0 0 0 0-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z" />
                </svg></i>
            </div>
            <h4 class="text-xl font-semibold mb-3">Real-time Chat</h4>
            <p class="text-gray-400">Integrated chat system for seamless communication during meetings.</p>
          </div>

          <!-- Benefit 6 -->
          <div id="benefit-6"
            class="bg-zinc-700/20 p-6 rounded-xl border border-gray-600 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all">
            <div class="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
              <i class="text-cyan-400 text-xl" data-fa-i2svg=""><svg width="24" height="24"
                  class="svg-inline--fa fa-clock" aria-hidden="true" focusable="false" data-prefix="fas"
                  data-icon="clock" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
                  data-fa-i2svg="">
                  <path fill="currentColor"
                    d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
                </svg></i>
            </div>
            <h4 class="text-xl font-semibold mb-3">Instant Access</h4>
            <p class="text-gray-400">Join meetings instantly with no downloads required. Start conferencing in
              seconds.</p>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>
