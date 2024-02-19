
// const ExpressServer = require('./assets/js/server');
export const obs = new OBSWebSocket();

export let currentScenes;
export let sceneMap = new Map();
export let sourcesMap = new Map();
export let groupMap = new Map();
export let queueMap = new Map();
export let queueRandomMap = new Map();

export const store = new Store({
  configName: 'obs-proxy-settings',
  defaults: {
    websocket: {
      port: 4444,
      password: ''
    },
    'twitch-user': ''
  }
});

export const twitchApiStore = new Store({
  configName: 'twitch-api',
  defaults: {
      'twitch-config': {
          clientId: '98a3op8i9g48ppw3ji60pw6qlcix52',
          oauthToken: ''
      }
  }
});

export const pointsSourceToggleStore = new Store({
  configName: 'points-source-toggle-mapping',
  defaults: {
    'points-source': JSON.stringify(new Map())
  }
});

export const sourceGroupStore = new Store({
  configName: 'source-group',
  defaults: {
    group: JSON.stringify(new Map())
  }
});

export const bitsSourceToggleStore = new Store({
  configName: 'bits-source-toggle-mapping',
  defaults: {
    'bits-source': JSON.stringify(new Map())
  }
});

export const bitsSourceGroupStore = new Store({
  configName: 'bits-source-group',
  defaults: {
    group: JSON.stringify(new Map())
  }
});

export const navbarTitleEl = document.getElementById('navbar-title');
export const twitchUserEl = document.getElementById("twitch-user");
export const wsPort = document.getElementById("websocket-port")
export const wsPass = document.getElementById("websocket-password")
export const snackbarContainer = document.querySelector("#demo-snackbar-example");
export const obsConnectBut = document.getElementById("obsConnect");
export const obsDisconnectBut = document.getElementById("obsDisconnect");
// Points Reward
export const rewardsElement = document.getElementById('rewards');
export const obsScenesElement = document.getElementById('scenes');
export const obsSourcesElement = document.getElementById('sources');
export const timedElement = document.getElementById('time-input');
export const groupElement = document.getElementById('group-input');
export const randomElement = document.getElementById('random-input');
export const randomLabelElement = document.getElementById('random-label');
export const pointsSourceListEl = document.getElementById('points-source-list');
// Bits
export const bitsInputElement = document.getElementById('bits-input');
export const obsScenesBitsElement = document.getElementById('bit-scenes');
export const obsSourcesBitsElement = document.getElementById('bit-sources');
export const timedBitsElement = document.getElementById('bit-time-input');
export const groupBitsElement = document.getElementById('bit-group-input');
export const randomBitsElement = document.getElementById('random-bits-input');
export const randomBitsLabelElement = document.getElementById('random-bits-label');
export const bitsSourceListEl = document.getElementById('bits-source-list');

export const dialog = document.querySelector('dialog');
export const showDialogButton = document.querySelector('#show-dialog');
export const twitchSaveDialogEl = document.getElementById('twitch-api-save');
export const clientIdEl = document.getElementById('twitch-api-client-id-input');
// const clientSecretEl = document.getElementById('twitch-api-client-secret-input');
export const oauthTokenEl = document.getElementById('twitch-oauth-input');
export const connectTwitchBtnEl = document.getElementById('connect-twitch-btn');
export const disconnectTwtichBtnEl = document.getElementById('disconnect-twitch-btn');
export const copyTextEl = document.querySelector('.copy');


export let { port, password } = store.get("websocket");
export let savedTwitchUser = store.get('twitch-user');
export let { clientId, oauthToken } = twitchApiStore.get('twitch-config');

if (dialog && !dialog.showModal) {
  dialogPolyfill.registerDialog(dialog);
}
if (showDialogButton) {
  showDialogButton.addEventListener('click', function() {
    dialog.showModal();
  });
}

if (dialog) {
  dialog.querySelector('.close').addEventListener('click', function() {
    dialog.close();
  });
}


copyTextEl.onclick = () => {
  document.execCommand('copy');
  const data = {
    message: "👍🏼 Text Copied",
    timeout: 2000,
  }
  snackbarContainer.MaterialSnackbar.showSnackbar(data);
}

copyTextEl.addEventListener('copy', event => {
  event.preventDefault();
  if (event.clipboardData) {
    event.clipboardData.setData('text/plain', copyTextEl.textContent);
  }
})

twitchSaveDialogEl.addEventListener('click', () => {
  oauthToken = oauthTokenEl.value;
  clientId = clientIdEl.value;
  const apiConfig = {
    clientId: clientIdEl.value,
    oauthToken: oauthTokenEl.value
  }
  twitchApiStore.set('twitch-config', apiConfig);
  clientId = apiConfig.clientId;
  oauthToken = apiConfig.oauthToken;
  dialog.close();
});

document.addEventListener("DOMContentLoaded", event => {
  twitchUserEl.value = savedTwitchUser;
  wsPort.value = port;
  wsPass.value = password;
  clientIdEl.value = clientId;
  // clientSecretEl.value = clientSecret;
  oauthTokenEl.value = oauthToken;
  setRewardPointsList(getPointsSourceMap());
  setBitsPointsList(getBitsSourceMap());
  // const app = new ExpressServer(5000);
  // app.start();
})


export const initNavbar = () => {
  const mainNavEl = document.getElementById('navbar-link-list');
  const navChildren = mainNavEl.children;
  for ( const child of navChildren) {
    const firstChild = child.children[0];
    firstChild.addEventListener('click', (e) => {
      e.preventDefault();
      removeActive();
      child.classList.add('active');
      showSpecificPage(firstChild.dataset.page);
      navbarTitleEl.innerText = firstChild.dataset.title;
    })
  };

  removeActive = () => {
    for ( const child of navChildren ) {
      child.classList.remove('active');
    }
  };

  showSpecificPage = (page) => {
    const mainBody = document.getElementById('main-body').children;
    for ( const section of mainBody) {
      if (section.id === page) {
        section.classList.remove('hide-page')
      } else {
        section.classList.add('hide-page')
      }
    }
  }
}

export const save = () => {
  port = wsPort.value;
  password = wsPass.value;
  savedTwitchUser = twitchUserEl.value;
  store.set('twitch-user', twitchUserEl.value);
  store.set('websocket', {port: wsPort.value, password: wsPass.value});
  const data = {
		message: "✅ OBS Websocket Settings Saved",
		timeout: 2000
  }
	snackbarContainer.MaterialSnackbar.showSnackbar(data);
  savedTwitchUser = twitchUserEl.value;
  port = wsPort.value;
  password = wsPass.value;
}

/* OBS Section */

export const connectObs = () => {
  const { port, password } = store.get("websocket")
  obs.connect({ address: `localhost:${port}`, password: `${password}` }).then(() => {
      const data = {
                message: "👍🏼 OBS Connected Successfully",
                timeout: 2000,
            }
      snackbarContainer.MaterialSnackbar.showSnackbar(data)
      this.toggleObsConnected();
      return obs.send('GetSceneList');
    })
    .then(data => {
      console.log('scene data', data);
      currentScenes = data.scenes;
      bitsCurrentScenes = data.scenes;
      data.scenes.forEach(scene => {
        sceneMap.set(scene.name, scene);
      });
    })
    .then(data => {
      setScenesList();
      setBitsScenesList();
    })

    // You must add this handler to avoid uncaught exceptions.
    obs.on("error", (err) => {
    console.error("socket error:", err)
    const data = {
            message: err,
            timeout: 2000,
        }
        snackbarContainer.MaterialSnackbar.showSnackbar(data)
    })

}

export const refreshObsScenes = () => {
      obs.send('GetSceneList').then((data) => {
        console.log('scene data', data);
        currentScenes = data.scenes;
        bitsCurrentScenes = data.scenes;
        data.scenes.forEach(scene => {
          sceneMap.set(scene.name, scene);
        });
      }).then(() => {
        setScenesList();
        setBitsScenesList();
      })
  }

export const disconnectObs = () => {
  obs.disconnect();
  const data = {
        message: "👋🏼 OBS Disconnected Successfully 👋🏼",
        timeout: 2000,
    }
    snackbarContainer.MaterialSnackbar.showSnackbar(data)
    this.toggleObsConnected()
}

export let isConnected = false;
export const toggleObsConnected = () => {
  isConnected = !isConnected;
  if ( isConnected ) {
    obsConnectBut.classList.add("hidden");
    obsDisconnectBut.classList.remove("hidden");
  } else {
    obsConnectBut.classList.remove("hidden");
        obsDisconnectBut.classList.add("hidden");
  }
}

/* Twitch Section */

export let isTwitchConnected = false;
export const toggleTwitchConnected = () => {
  if ( !isTwitchConnected ) {
    isTwitchConnected = !isTwitchConnected;
    connectTwitchBtnEl.classList.add('hidden');
    disconnectTwtichBtnEl.classList.remove('hidden');
  }
}

export const toggleTwitchDisconnected = () => {
  if ( isTwitchConnected ) {
    isTwitchConnected = !isTwitchConnected;
    connectTwitchBtnEl.classList.remove('hidden');
    disconnectTwtichBtnEl.classList.add('hidden');
  }
}
 ComfyJS.onConnected = () => {
  const data = {
		message: "👍🏼 Twitch Connected Successfully ",
		timeout: 2000
  }
	snackbarContainer.MaterialSnackbar.showSnackbar(data)
  toggleTwitchConnected();
}

ComfyJS.onError = (err) => {
  const data = {
    message: `🛑 ${err} 🛑`,
    timeout: 4000
  }
  snackbarContainer.MaterialSnackbar.showSnackbar(data)
  toggleTwitchDisconnected();
  console.log('err', err);
}


export const connectTwitch = async () => {
  ComfyJS.Init(savedTwitchUser, `${oauthToken}`, savedTwitchUser);
  getRewards();
  startTwitchListener();
}

export const disconnectTwitch = () => {
  ComfyJS.Disconnect();
  const data = {
		message: "👋🏼 Twitch Disconnected Successfully 👋🏼",
		timeout: 2000
  }
	snackbarContainer.MaterialSnackbar.showSnackbar(data)
  toggleTwitchDisconnected();
}

export const getRewards = async () => {
  let channelRewards = await ComfyJS.GetChannelRewards(clientId);
  setRewardsList(channelRewards);
}
  
export const startTwitchListener = () => {
  // ComfyJS
  ComfyJS.onReward = ( user, reward, cost, extra ) => {
    console.log('reward used', reward)
    let currentPointsSourceMap = getPointsSourceMap();
    runToggles(currentPointsSourceMap, reward, user)
  }

  ComfyJS.onCheer = ( user, message, bits, flags, extra ) => {
    
    const data = {
      user: user,
      message: message,
      bits: bits,
      flags: flags,
      extra: extra
    };
    console.log('data', data);
    console.log('dataJson', JSON.stringify(data))

    let currentBitsSourceMap = getBitsSourceMap();
    const currentBits = bits.toString();
    runToggles(currentBitsSourceMap, currentBits, user)

  }
}

export const runToggles = ( map, reward, user ) => {
  if ( map.has(reward) ) {
    const currentSceneSource = map.get(reward);
    if (currentSceneSource) {
      if (currentSceneSource.random) {
        toggleRandomSources(currentSceneSource, user)
      } else {
        const group = currentSceneSource.group;
        if (group === 'None') {
          if (currentSceneSource.time === 0) {
            toggleSpecifiedSource(currentSceneSource.source);
          } else {
            checkQueueStatus(currentSceneSource.source, currentSceneSource, user);
          }
        } else {
          toggleGroup(group, reward);
        }
      }
    }
  }
}


export const checkQueueStatus = (currentReward, source, user) => {
  if (queueMap.has(currentReward)) {
    const currentActiveReward = queueMap.get(currentReward);
    currentActiveReward.rewardArray.push(user);
    // set reward
    toggleRewardQueue(currentActiveReward);
  } else {
    queueMap.set(currentReward, {reward: source, rewardArray: [user], flag: false});
    const currentActiveReward = queueMap.get(currentReward);
    toggleRewardQueue(currentActiveReward);
  }
}

export const checkQueueRandomStatus = (currentReward, folder, sources, user) => {
  if (queueRandomMap.has(currentReward)) {
    const currentActiveReward = queueRandomMap.get(currentReward);
    currentActiveReward.rewardArray.push(user);
    // set reward
    toggleRandomRewardQueue(currentActiveReward);
  } else {
    queueRandomMap.set(currentReward, {rewards: sources, folder: folder, rewardArray: [user], flag: false});
    const currentActiveReward = queueRandomMap.get(currentReward);
    toggleRandomRewardQueue(currentActiveReward);
  }
}

export const toggleRewardQueue = (queue) => {
  if (!queue.flag) {
    // queue.flag = true;
    const currentActiveReward = queueMap.get(queue.reward.source);
    timedToggleSource(queue.reward.source, queue.reward.time);
  }
}

export const toggleRandomRewardQueue = queue => {
  if (!queue.flag) {
    // queue.flag = true;
    timedToggleRandomSource(queue.folder.source, queueRandomMap);
  }
}


export const toggleGroup = (group, reward) => {
  let currentPointsSourceMap = getPointsSourceMap();
  const currentGroupMap = getStoreMap(sourceGroupStore, 'source-group');
  const groupArray = JSON.parse(currentGroupMap.get(group));
  groupArray.forEach( item => {
    const currentSceneSource = currentPointsSourceMap.get(item);
    if ( item !== reward ) {
      toggleOffSpecifiedSource( currentSceneSource.source);
    } else {
      toggleSpecifiedSource(currentSceneSource.source);
    }
  });

}

export const toggleBitsGroup = (group, reward) => {

}

export const mapSourceReward = () => {
  const currentReward = rewardsElement.value;
  const sceneVal = obsScenesElement.value;
  const sourceVal = obsSourcesElement.value;
  const numVal = parseFloat(timedElement.value) * 1000;
  const timedVal = numVal === 0 ? 0 : numVal + 1000;
  const groupVal = groupElement.value ? groupElement.value : 'None';
  const randomVal = randomElement.checked ? true : false;
  if (currentReward && sceneVal && sourceVal && currentReward !== 'not-connected' && sceneVal !== 'not-connected' && sourceVal !== 'not-connected' ) {
    let currentPointsSourceMap = getPointsSourceMap();
    currentPointsSourceMap.set(currentReward, {scene: sceneVal, source: sourceVal, time: timedVal, group: groupVal, random: randomVal});
    setPointsSourceMap(currentPointsSourceMap);
  } else {
    const data = {
      message: "🛑 Please make sure all services are connected 🛑",
      timeout: 4000,
    }
    snackbarContainer.MaterialSnackbar.showSnackbar(data)
  }
}

export const mapSourceBits = () => {
  const currentBitsSelected = bitsInputElement.value;
  const sceneVal = obsScenesBitsElement.value;
  const sourceVal = obsSourcesBitsElement.value;
  const numVal = parseFloat(timedBitsElement.value) * 1000;
  const timedVal = numVal === 0 ? 0 : numVal + 1000;
  const groupVal = groupBitsElement.value ? groupBitsElement.value : 'None';
  const randomBitsVal = randomBitsElement.checked ? true : false;

  if (currentBitsSelected && sceneVal && sourceVal && currentBitsSelected !== 'not-connected' && sceneVal !== 'not-connected' && sourceVal !== 'not-connected' ) {
    let currentBitsSourceMap = getBitsSourceMap();
    currentBitsSourceMap.set(currentBitsSelected, {scene: sceneVal, source: sourceVal, time: timedVal, group: groupVal,  random: randomBitsVal});
    setBitsSourceMap(currentBitsSourceMap);
  } else {
    const data = {
      message: "🛑 Please make sure all services are connected 🛑",
      timeout: 4000,
    }
    snackbarContainer.MaterialSnackbar.showSnackbar(data)
  }
}

export const removeSingleSourceReward = key => {
  let currentPointsSourceMap = getPointsSourceMap();
  currentPointsSourceMap.delete(key);
  setPointsSourceMap(currentPointsSourceMap);
}

export const removeSingleBitsSource = key => {
  let currentPointsSourceMap = getBitsSourceMap();
  currentPointsSourceMap.delete(key);
  setBitsSourceMap(currentPointsSourceMap);
}

export const getPointsSourceMap = () => {
  return getStoreMap(pointsSourceToggleStore, 'points-source');
}

export const setPointsSourceMap = (map) => {
  setStoreMap(pointsSourceToggleStore, 'points-source', map);
  setRewardPointsList(getPointsSourceMap());
}

export const getBitsSourceMap = () => {
  return getStoreMap(bitsSourceToggleStore, 'bits-source');
}

export const setBitsSourceMap = (map) => {
  setStoreMap(bitsSourceToggleStore, 'bits-source', map);
  setBitsPointsList(getBitsSourceMap());
}

export const getStoreMap = (store, key) => {
  const currentPointsSource = store.get(key);
  if (currentPointsSource && Object.keys(currentPointsSource).length > 0 && currentPointsSource !== '{}') {
    return new Map(JSON.parse(currentPointsSource));
  } else {
    return new Map();
  }
}

export const setStoreMap = (store, key, map) => {
  store.set(key, JSON.stringify(Array.from(map.entries())));
}

export const setGroupStoreMapping  = () => {
  setStoreMap(sourceGroupStore, 'source-group', new Map());
  const currentMap = getPointsSourceMap();
  currentMap.forEach((val, key) => {
    const groupVal = val.group;
    if (groupVal !== 'None') {
      const currentGroupMap =  getStoreMap(sourceGroupStore, 'source-group');
      let currentSet = new Set();
      if (currentGroupMap.has(groupVal)) {
        currentSet = new Set(JSON.parse( currentGroupMap.get(groupVal) ));
      } 
      currentSet.add(key);
      currentGroupMap.set(groupVal, JSON.stringify(Array.from( currentSet )));
      setStoreMap(sourceGroupStore, 'source-group', currentGroupMap);
    }
  });
}

export const setBitGroupStoreMapping  = () => {
  setStoreMap(bitsSourceGroupStore, 'bits-source-group', new Map());
  const currentMap = getBitsSourceMap();
  currentMap.forEach((val, key) => {
    const groupVal = val.group;
    if (groupVal !== 'None') {
      const currentBitGroupMap =  getStoreMap(bitsSourceGroupStore, 'bits-source-group');
      let currentSet = new Set();
      if (currentBitGroupMap.has(groupVal)) {
        currentSet = new Set(JSON.parse( currentBitGroupMap.get(groupVal) ));
      } 
      currentSet.add(key);
      currentBitGroupMap.set(groupVal, JSON.stringify(Array.from( currentSet )));
      setStoreMap(bitsSourceGroupStore, 'bits-source-group', currentBitGroupMap);
    }
  });
}

export const clearPointsSourceMap = () => {
  pointsSourceToggleStore.set('points-source', new Map());
  setRewardPointsList(getPointsSourceMap());
}

export const clearGroupMap = () => {
  sourceGroupStore.set('source-group', new Map());
}

export const clearBitsSourceMap = () => {
  bitsSourceToggleStore.set('bits-source', new Map());
  setBitsPointsList(getBitsSourceMap());
}

export const clearBitsGroupMap = () => {
  bitsSourceGroupStore.set('bits-source-group', new Map());
}

/* Setting Scenes */

export const setScenesList = () => {
  let firstScene;
  obsScenesElement.innerHTML = '';
  currentScenes.forEach((scene, index) => {
    const optionEl = document.createElement("option");
    optionEl.value = scene.name;
    if ( index === 0 ) {
      optionEl.selected = true;
      firstScene = scene.name;
    }
    const text = document.createTextNode(scene.name);
    // scene also has name of sources
    optionEl.appendChild(text);
    obsScenesElement.appendChild(optionEl);
    scene.sources.forEach(source => {
      sourcesMap.set(source.name, source);
    })
  });
  setSourceList(firstScene);
}

export const setSourceList = (scene) => {
    obsSourcesElement.innerHTML = '';
    const selectOption = document.createElement("option");
    selectOption.selected = true;
    selectOption.value = null;
    selectOption.appendChild(document.createTextNode('(Select a source)'));
    obsSourcesElement.appendChild(selectOption);
    const selectedScene = sceneMap.get(scene);
    const selectedSources = selectedScene.sources;
    selectedSources.forEach((source, index) => {
      const optionEl = document.createElement("option");
      let text;
      if (source.type === 'ffmpeg_source') {
        obs.sendCallback('GetMediaDuration', {
          sourceName: source.name,
        }, (err, res) => {
          if (err) console.error(err);
          const mediaTime = source.name + ` (${res.mediaDuration / 1000}s)`
          optionEl.value = source.name;
          text = document.createTextNode(mediaTime);
          // scene also has name of sources
          optionEl.appendChild(text);
          optionEl.setAttribute('time', res.mediaDuration / 1000)
          obsSourcesElement.appendChild(optionEl);
        })
      } else {
        optionEl.value = source.name;
        text = document.createTextNode(source.name);
        // scene also has name of sources
        optionEl.appendChild(text);
        obsSourcesElement.appendChild(optionEl);
      }
    })
  }

export const setBitsScenesList = () => {
  let firstScene;
  obsScenesBitsElement.innerHTML = '';
  bitsCurrentScenes.forEach((scene, index) => {
    const optionEl = document.createElement("option");
    optionEl.value = scene.name;
    if ( index === 0 ) {
      optionEl.selected = true;
      firstScene = scene.name;
    }
    const text = document.createTextNode(scene.name);
    // scene also has name of sources
    optionEl.appendChild(text);
    obsScenesBitsElement.appendChild(optionEl);
    scene.sources.forEach(source => {
      sourcesMap.set(source.name, source);
    })
  });
  setBitsSourceList(firstScene);
}

export const setBitsSourceList = (scene) => {
    obsSourcesBitsElement.innerHTML = '';
    const selectOption = document.createElement("option");
    selectOption.selected = true;
    selectOption.value = null;
    selectOption.appendChild(document.createTextNode('(Select a source)'));
    obsSourcesBitsElement.appendChild(selectOption);
    const selectedScene = sceneMap.get(scene);
    const selectedSources = selectedScene.sources;
    selectedSources.forEach((source, index) => {
      const optionEl = document.createElement("option");
      let text;
      if (source.type === 'ffmpeg_source') {
        obs.sendCallback('GetMediaDuration', {
          sourceName: source.name,
        }, (err, res) => {
          if (err) console.error(err);
          const mediaTime = source.name + ` (${res.mediaDuration / 1000}s)`
          optionEl.value = source.name;
          text = document.createTextNode(mediaTime);
          // scene also has name of sources
          optionEl.appendChild(text);
          optionEl.setAttribute('time', res.mediaDuration / 1000)
          obsSourcesBitsElement.appendChild(optionEl);
        })
      } else {
        optionEl.value = source.name;
        text = document.createTextNode(source.name);
        // scene also has name of sources
        optionEl.appendChild(text);
        obsSourcesBitsElement.appendChild(optionEl);
      }
    })
  }

  /** Sets dropdown list for reward points */
export const setRewardsList = (rewards) => {
    rewardsElement.innerHTML = '';
    rewards.forEach(reward => {
      const optionEl = document.createElement("option");
      optionEl.value = reward.title;
      const text = document.createTextNode(`${reward.title} (${reward.cost})`);
      // scene also has name of sources
      optionEl.appendChild(text);
      rewardsElement.appendChild(optionEl);
    })
  }

export const setRewardPointsList = (rewardPoints) => {
    pointsSourceListEl.innerHTML = `
    <thead>
      <tr>
        <th class="mdl-data-table__cell--non-numeric">Reward</th>
        <th class="mdl-data-table__cell--non-numeric">Scene</th>
        <th class="mdl-data-table__cell--non-numeric">Source</th>
        <th class="data-table-middle">Seconds</th>
        <th class="mdl-data-table__cell--non-numeric">Group</th>
        <th class="mdl-data-table__cell--non-numeric">Random?</th>
        <th width="10px"></th>
        <th width="10px"></th>
        <th width="10px"></th>
      </tr>
    </thead>`;
    const tbodyEl = document.createElement('tbody');
    for (const [key, val] of rewardPoints) {
      const trEl = document.createElement('tr');
      let listItem = `
        <td class="mdl-data-table__cell--non-numeric reward">${key}</td>
        <td class="mdl-data-table__cell--non-numeric">${val.scene}</td>
        <td class="mdl-data-table__cell--non-numeric">${val.source}</td>
        <td class="data-table-middle">${val.time/1000 === 0 ? 0 : (val.time - 1000 )/1000 }</td>
        <td class="mdl-data-table__cell--non-numeric">${val.group}</td>
        <td class="mdl-data-table__cell--non-numeric">${val.random ? 'Yes' : 'No'}</td>
        <td><i class="material-icons pointer" onclick="testReward(this)">play_arrow</i></td>
        <td><i class="material-icons pointer" onclick="editRow(this)">create</i></td>
        <td><i class="material-icons pointer" onclick="removeRow(this)">delete</i></td>`;
      trEl.innerHTML = listItem;
      tbodyEl.appendChild(trEl);
    }
    // pointsSourceListEl.appendChild(p.childNodes[0]);
    pointsSourceListEl.appendChild(tbodyEl);
    setGroupStoreMapping();
  }

export const testReward = (row) => {
    const currentReward = row.parentNode.parentNode.childNodes[0].nextSibling.innerHTML;
    let currentPointsSourceMap = getPointsSourceMap();
    runToggles(currentPointsSourceMap, currentReward, 'test')
  }


export const editRow = row => {
    const reward = row.parentNode.parentNode.childNodes[0].nextSibling.innerHTML;
    const scene = row.parentNode.parentNode.childNodes[2].nextSibling.innerHTML;
    const source = row.parentNode.parentNode.childNodes[4].nextSibling.innerHTML;
    const time = row.parentNode.parentNode.childNodes[6].nextSibling.innerHTML;
    const group = row.parentNode.parentNode.childNodes[8].nextSibling.innerHTML;
    const random = row.parentNode.parentNode.childNodes[10].nextSibling.innerHTML;
    rewardsElement.value = reward;
    obsScenesElement.value = scene;
    obsScenesElement.selected = true;
    setSourceList(scene);
    // Get new obsSourcesElement
    setTimeout(() => {
      const latestObsSourcesElement = document.getElementById('sources');
      latestObsSourcesElement.value = source 
    }, 100)
    timedElement.value = time;
    groupElement.value = group;
    randomElement.checked = (random === 'Yes') ? true : false;
    (random === 'Yes') ? randomLabelElement.MaterialCheckbox.check() : randomLabelElement.MaterialCheckbox.uncheck();

  }

export const removeRow = row => {
    const currentReward = row.parentNode.parentNode.childNodes[0].nextSibling.innerHTML;
    removeSingleSourceReward(currentReward)
  }

  /* End Set Scenes */

export const onSceneSelectionChange = () => {
    const selectedSceneValue = obsScenesElement.value;
    setSourceList(selectedSceneValue);
  }

export const onSourceSelectionChange = () => {
    //When source is selected, set timedElement to value 
    const selectedIndex = obsSourcesElement.selectedIndex;
    const selectedOption = obsSourcesElement.options[selectedIndex];
    const timeValue = selectedOption.getAttribute('time');

    if (timeValue) {
      timedElement.value = timeValue;
    } else {
      timedElement.value = 0;
    }
  }

  // BITS
  export const setBitsPointsList = (bitSourceData) => {
    bitsSourceListEl.innerHTML = `
    <thead>
      <tr>
        <th class="mdl-data-table__cell--non-numeric">Bits</th>
        <th class="mdl-data-table__cell--non-numeric">Scene</th>
        <th class="mdl-data-table__cell--non-numeric">Source</th>
        <th class="data-table-middle">Seconds</th>
        <th class="mdl-data-table__cell--non-numeric">Group</th>
        <th class="mdl-data-table__cell--non-numeric">Random?</th>
        <th width="10px"></th>
        <th width="10px"></th>
        <th width="10px"></th>
      </tr>
    </thead>`;
    const tbodyEl = document.createElement('tbody');
    for (const [key, val] of bitSourceData) {
      const trEl = document.createElement('tr');
      let listItem = `
        <td class="mdl-data-table__cell--non-numeric reward">${key}</td>
        <td class="mdl-data-table__cell--non-numeric">${val.scene}</td>
        <td class="mdl-data-table__cell--non-numeric">${val.source}</td>
        <td class="data-table-middle">${val.time/1000 === 0 ? 0 : (val.time - 1000 )/1000 }</td>
        <td class="mdl-data-table__cell--non-numeric">${val.group}</td>
        <td class="mdl-data-table__cell--non-numeric">${val.random ? 'Yes' : 'No'}</td>
        <td><i class="material-icons pointer" onclick="testBits(this)">play_arrow</i></td>
        <td><i class="material-icons pointer" onclick="editBitsRow(this)">create</i></td>
        <td><i class="material-icons pointer" onclick="removeBitsRow(this)">delete</i></td>`;
      trEl.innerHTML = listItem;
      tbodyEl.appendChild(trEl);
    }
    // pointsSourceListEl.appendChild(p.childNodes[0]);
    bitsSourceListEl.appendChild(tbodyEl);
    setBitGroupStoreMapping();
  }

  export const testBits = (row) => {
    const currentBits = row.parentNode.parentNode.childNodes[0].nextSibling.innerHTML;
    let currentBitsSourceMap = getBitsSourceMap();
    runToggles(currentBitsSourceMap, currentBits, 'test')
  }

  export const editBitsRow = row => {
    const latestBits = row.parentNode.parentNode.childNodes[0].nextSibling.innerHTML;
    const scene = row.parentNode.parentNode.childNodes[2].nextSibling.innerHTML;
    const source = row.parentNode.parentNode.childNodes[4].nextSibling.innerHTML;
    const time = row.parentNode.parentNode.childNodes[6].nextSibling.innerHTML;
    const group = row.parentNode.parentNode.childNodes[8].nextSibling.innerHTML;
    const random = row.parentNode.parentNode.childNodes[10].nextSibling.innerHTML;
    rewardsElement.value = latestBits;
    obsScenesBitsElement.value = scene;
    obsScenesBitsElement.selected = true;
    setBitsSourceList(scene);
    // Get new obsSourcesElement
    setTimeout(() => {
      const latestObsSourcesElement = document.getElementById('bit-sources');
      latestObsSourcesElement.value = source 
    }, 100)
    timedBitsElement.value = time;
    groupBitsElement.value = group;
    randomBitsElement.checked = (random === 'Yes') ? true : false;
    (random === 'Yes') ? randomBitsLabelElement.MaterialCheckbox.check() : randomBitsLabelElement.MaterialCheckbox.uncheck();
  }

  export const removeBitsRow = row => {
    const currentReward = row.parentNode.parentNode.childNodes[0].nextSibling.innerHTML;
    console.log('currentReward', currentReward);
    removeSingleBitsSource(currentReward)
  }

  /* End Set Scenes */

  export const onBitsSceneSelectionChange = () => {
    const selectedSceneValue = obsScenesBitsElement.value;
    setBitsSourceList(selectedSceneValue);
  }

  export const onBitsSourceSelectionChange = () => {
    //When source is selected, set timedElement to value 
    const selectedIndex = obsSourcesBitsElement.selectedIndex;
    const selectedOption = obsSourcesBitsElement.options[selectedIndex];
    const timeValue = selectedOption.getAttribute('time');

    if (timeValue) {
      timedBitsElement.value = timeValue;
    } else {
      timedBitsElement.value = 0;
    }
  }

  /* OBS Toggling */

  export const clearPointsTable = () => {
    clearPointsSourceMap();
    clearGroupMap();

  }

  export const clearBitsTable = () => {
    clearBitsSourceMap();
    clearBitsGroupMap();

  }
  
  export const toggleSpecifiedSource = source => {
    const key = source;
    const selectedSource = sourcesMap.get(key);
    let isRendered = selectedSource.render;
    isRendered = !isRendered;
    selectedSource.render = isRendered;
    sourcesMap.set(key, selectedSource);
    toggleSource(source, isRendered);
  }
  
  export const toggleOffSpecifiedSource = source => {
    const selectedSource = sourcesMap.get(source);
    let isRendered = false;
    selectedSource.render = isRendered;
    sourcesMap.set(source, selectedSource);
    toggleSource(source, isRendered);
  }
  
  export const toggleOnSpecifiedSource = source => {
    const key = source;
    const selectedSource = sourcesMap.get(key);
    let isRendered = true;
    selectedSource.render = isRendered;
    sourcesMap.set(key, selectedSource);
    toggleSource(source, isRendered);
  }

  export const toggleSource = (source, toggled) => {
    obs.sendCallback('SetSceneItemRender', {
      source: source,
      render: toggled
    }, (err, res) => {
      if (err) console.error(err);
    })
  }

  export const timedToggleSource = (source, time) => {
    const key = source;
    const selectedSource = sourcesMap.get(key);
    const currentActiveReward = queueMap.get(source);
    if(currentActiveReward.rewardArray.length > 0){
      currentActiveReward.flag = true;
      currentActiveReward.rewardArray.shift();
      toggleSource(source, false);
      setTimeout(() => {
        toggleSource(source, true);
        setTimeout(() => {
          toggleSource(source, false);
          if(currentActiveReward.rewardArray.length > 0) {
            timedToggleSource(currentActiveReward.reward.source, currentActiveReward.reward.time, currentActiveReward);
          } else {
            currentActiveReward.flag = false;
          }
        }, time);
      }, 500);
      selectedSource.render = false;
      sourcesMap.set(key, selectedSource);
    }

  }

  export const timedToggleRandomSource = (key, chosenMap) => {
    const selectedFolder = chosenMap.get(key);
    if (selectedFolder.rewardArray.length > 0) {
      selectedFolder.flag = true;
      selectedFolder.rewardArray.shift();
      const currentArray = selectedFolder.rewards;
      const currentReward = currentArray[Math.floor(Math.random()*currentArray.length)];
      console.log('currentReward', currentReward);
      if ( currentReward.type === 'ffmpeg_source') {
        obs.sendCallback('GetMediaDuration', {
          sourceName: currentReward.name,
        }, (err, res) => {
          if (err) console.error(err);
          const mediaTime = res.mediaDuration;
          const currentSourceName = currentReward.name;
          toggleSource(currentSourceName, false);
          setTimeout(() => {
            toggleSource(currentSourceName, true);
            setTimeout(() => {
              toggleSource(currentSourceName, false);
              if(selectedFolder.rewardArray.length > 0) {
                timedToggleRandomSource(key, chosenMap);
              } else {
                selectedFolder.flag = false;
              }
              console.log('timedOut')
            }, mediaTime);
          }, 500);
        })
      } else {
        /* TODO: Get other source types to work */
      }
    }
  }

  export const toggleRandomSources = (folder, user) => {
    console.log('folder', folder);
    obs.send('GetSceneList').then(data => {
      const scenes = data.scenes;
      const currentScene = scenes.filter(scene => scene.name === folder.scene);
      const sources = currentScene[0].sources;
      const currentFolder = sources.filter(source => source.name === folder.source)[0];
      const groupedSources = currentFolder.groupChildren;
      checkQueueRandomStatus(folder.source, folder, groupedSources, user);
      // queueRandomMap.set(folder.source, {rewards: groupedSources, flag: false})
    })
    // obs.sendCallback('')
  }

  export const getToken = () => {
    shell.openExternal('https://twitchapps.com/tokengen/');
  }

  export const getTwitch = () => {
    shell.openExternal('https://id.twitch.tv/oauth2/authorize?client_id=98a3op8i9g48ppw3ji60pw6qlcix52&redirect_uri=http://localhost&response_type=token&scope=chat:read')
      .then(val => {
        console.log('val', val)
      }).catch( err => {
        console.error(err)
      })
  }

initNavbar();