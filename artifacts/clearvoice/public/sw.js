const CACHE_NAME = 'clearvoice-shell-v10';
const CORE_ASSETS = [
  'manifest.webmanifest',
  'icon.svg',
  'favicon.svg',
  'symbols/clearvoice-starter.svg',
  'symbols/nod_,_to.svg',
  'symbols/mistake_no_wrong.svg',
  'symbols/good.svg',
  'symbols/help_,_to.svg',
  'symbols/toilet.svg',
  'symbols/bad.svg',
  'symbols/want_,_to.svg',
  'symbols/more.svg',
  'symbols/go_,_to.svg',
  'symbols/what.svg',
  'symbols/where.svg',
  'symbols/make_,_to.svg',
  'symbols/get_,_to.svg',
  'symbols/give_,_to.svg',
  'symbols/come_,_to.svg',
  'symbols/look_,_to.svg',
  'symbols/take_a_work_break_,_to.svg',
  'symbols/class_room.svg',
  'symbols/computer_1.svg',
  'symbols/paper.svg',
  'symbols/loud.svg',
  'symbols/bright_room.svg',
  'symbols/confused_man.svg',
  'symbols/care_assistant_1a.svg',
  'symbols/family.svg',
  'symbols/family_2.svg',
  'symbols/hold_,_to.svg',
  'symbols/change_,_to.svg',
  'symbols/minute.svg',
  'symbols/water.svg',
  'symbols/drink_,_to.svg',
  'symbols/breakfast_1.svg',
  'symbols/lunch_1.svg',
  'symbols/dinner.svg',
  'symbols/hungry.svg',
  'symbols/thirsty.svg',
  'symbols/hot.svg',
  'symbols/food_cold.svg',
  'symbols/eat_,_to.svg',
  'symbols/taste_,_to.svg',
  'symbols/finish.svg',
  'symbols/full.svg',
  'symbols/house.svg',
  'symbols/school.svg',
  'symbols/outside.svg',
  'symbols/room.svg',
  'symbols/shop.svg',
  'symbols/near.svg',
  'symbols/inside_room.svg',
  'symbols/door.svg',
  'symbols/light.svg',
  'symbols/flatscreen_tv.svg',
  'symbols/clothes_generic.svg',
  'symbols/blanket.svg',
  'symbols/chair.svg',
  'symbols/window.svg',
  'symbols/clean_room.svg',
  'symbols/open_,_to.svg',
  'symbols/close_,_to.svg',
  'symbols/turn_on_,_to.svg',
  'symbols/turn_off_,_to.svg',
  'symbols/single_bed.svg',
  'symbols/desk.svg',
  'symbols/write_,_to.svg',
  'symbols/ready.svg',
  'symbols/show_me_,_to.svg',
  'symbols/food.svg',
  'symbols/play_,_to.svg',
  'symbols/read_,_to.svg',
  'symbols/watch_,_to.svg',
  'symbols/music.svg',
  'symbols/draw_,_to.svg',
  'symbols/walk_,_to.svg',
  'symbols/rest_,_to.svg',
  'symbols/go_outside_,_to.svg',
  'symbols/face_neutral_3.svg',
  'symbols/hand_bag.svg',
  'symbols/healthy.svg',
  'symbols/hello.svg',
  'symbols/wait_,_to.svg',
  'symbols/mobile_phone.svg',
  'symbols/glasses.svg',
  'symbols/key_2.svg',
  'symbols/toys.svg',
  'symbols/charger_electric.svg',
  'symbols/headphones.svg',
  'symbols/wallet.svg',
  'symbols/medicine.svg',
  'symbols/airways.svg',
  'symbols/head.svg',
  'symbols/stomach.svg',
  'symbols/wave2-people-parent.svg',
  'symbols/wave2-people-friend.svg',
  'symbols/wave2-people-teacher.svg',
  'symbols/wave2-people-medical-role.svg',
  'symbols/wave2-people-someone.svg',
  'symbols/wave2-people-my-turn.svg',
  'symbols/wave2-people-come-with-me.svg',
  'symbols/wave2-people-sibling.svg',
  'symbols/wave2-people-neighbor.svg',
  'symbols/wave2-people-see-someone.svg',
  'symbols/wave2-people-stay-with-me.svg',
  'symbols/wave2-people-who-is-here.svg',
  'symbols/wave2-people-nice-to-see-you.svg',
  'symbols/wave2-feelings-happy.svg',
  'symbols/wave2-feelings-sad.svg',
  'symbols/wave2-feelings-worried.svg',
  'symbols/wave2-feelings-angry.svg',
  'symbols/wave2-feelings-calm.svg',
  'symbols/wave2-feelings-tired.svg',
  'symbols/wave2-feelings-excited.svg',
  'symbols/wave2-feelings-bored.svg',
  'symbols/wave2-feelings-uncomfortable.svg',
  'symbols/wave2-feelings-okay.svg',
  'symbols/wave2-feelings-proud.svg',
  'symbols/wave2-feelings-better.svg',
  'symbols/wave2-feelings-need-quiet.svg',
  'symbols/wave2-feelings-unsure.svg',
  'symbols/wave2-feelings-overwhelmed.svg',
  'symbols/wave2-feelings-alone.svg',
  'symbols/wave2-feelings-talk.svg',
  'symbols/wave2-activities-listen.svg',
  'symbols/wave2-activities-start.svg',
  'symbols/wave2-activities-join.svg',
  'symbols/wave2-activities-more-time.svg',
  'symbols/wave2-activities-else.svg',
  'symbols/wave2-activities-what-do.svg',
  'symbols/wave2-activities-later.svg',
  'symbols/wave3-food-snack.svg',
  'symbols/wave3-food-that-one.svg',
  'symbols/wave3-food-can-have.svg',
  'symbols/wave3-food-help-choose.svg',
  'symbols/wave3-food-not-want.svg',
  'symbols/wave3-food-still-hungry.svg',
  'symbols/wave3-places-work.svg',
  'symbols/wave3-places-park.svg',
  'symbols/wave3-places-here.svg',
  'symbols/wave3-places-there.svg',
  'symbols/wave3-places-where-next.svg',
  'symbols/wave3-places-far.svg',
  'symbols/wave3-places-take-there.svg',
  'symbols/wave3-places-where-going.svg',
  'symbols/wave3-places-go-home.svg',
  'symbols/wave3-places-find.svg',
  'symbols/wave3-places-close.svg',
  'symbols/wave3-home-kitchen.svg',
  'symbols/wave3-home-sit-here.svg',
  'symbols/wave3-home-help-this.svg',
  'symbols/wave3-home-want-here.svg',
  'symbols/wave3-school-coworker.svg',
  'symbols/wave3-school-meeting.svg',
  'symbols/wave3-school-task.svg',
  'symbols/wave3-school-read-this.svg',
  'symbols/wave3-school-explain.svg',
  'symbols/wave3-school-different-task.svg',
  'symbols/wave3-school-what-next.svg',
  'symbols/wave3-personal-tablet.svg',
  'symbols/wave3-personal-shoes.svg',
  'symbols/wave3-personal-book.svg',
  'symbols/wave3-personal-my-things.svg',
  'symbols/wave3-personal-need-this.svg',
  'symbols/wave3-personal-bring.svg',
  'symbols/wave3-personal-put-here.svg',
  'symbols/wave3-personal-use.svg',
  'symbols/wave3-personal-keep-nearby.svg',
  'symbols/wave3-personal-which-mine.svg',
];

function appUrl(path) {
  return new URL(path, self.registration.scope).href;
}

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

function discoverShellAssets(html, indexUrl) {
  const assets = [];
  const references = html.matchAll(/(?:src|href)="([^"]+)"/g);
  for (const [, reference] of references) {
    try {
      const url = new URL(reference, indexUrl);
      if (sameOrigin(url)) assets.push(url.href);
    } catch {
      console.warn('[Clearvoice SW] Ignoring invalid shell asset reference:', reference);
    }
  }
  return assets;
}

async function cacheAppShell() {
  const scopeUrl = appUrl('./');
  const indexUrl = appUrl('index.html');
  const indexResponse = await fetch(indexUrl, { cache: 'no-store' });
  if (!indexResponse.ok) throw new Error(`Application shell returned HTTP ${indexResponse.status}.`);

  const html = await indexResponse.clone().text();
  const cache = await caches.open(CACHE_NAME);
  await cache.put(scopeUrl, indexResponse.clone());
  await cache.put(indexUrl, indexResponse.clone());

  const assets = [...new Set([
    ...CORE_ASSETS.map(appUrl),
    ...discoverShellAssets(html, indexUrl),
  ])];
  await cache.addAll(assets);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    cacheAppShell()
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[Clearvoice SW] Install failed; offline support is unavailable until the next update.', error);
        throw error;
      }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim())
      .catch((error) => {
        console.error('[Clearvoice SW] Activation cleanup failed:', error);
        throw error;
      }),
  );
});

async function handleNavigation(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[Clearvoice SW] Navigation request failed; using the cached shell:', error);
    const cached = await caches.match(request) || await caches.match(appUrl('index.html'));
    if (cached) return cached;
    throw error;
  }
}

async function handleAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[Clearvoice SW] Asset request failed; no application-page fallback will be used:', request.url, error);
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || !sameOrigin(requestUrl)) return;
  event.respondWith(event.request.mode === 'navigate' ? handleNavigation(event.request) : handleAsset(event.request));
});