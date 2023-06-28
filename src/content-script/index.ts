import { Message } from '@/utils/message';
import { nanoid } from 'nanoid';

import { v4 as uuid } from 'uuid';

const channelName = nanoid();
const isOpera = /Opera|OPR\//i.test(navigator.userAgent);

const rabbyEnvInjection = {
  channelName: channelName,
  isDefaultWallet: true,
  uuid: uuid(),
  isOpera: isOpera,
}
localStorage.setItem('rabby:channelName', rabbyEnvInjection.channelName);
localStorage.setItem('rabby:isDefaultWallet', rabbyEnvInjection.isDefaultWallet.toString());
localStorage.setItem('rabby:uuid', rabbyEnvInjection.uuid);
localStorage.setItem('rabby:isOpera', rabbyEnvInjection.isOpera.toString());

declare global {
  interface Window {
    __RD_isDappSafeView?: boolean;
    __RD_isDappView?: boolean;
  }
}

const injectProviderScript = () => {
  // the script element with src won't execute immediately
  // use inline script element instead!
  // in prevent of webpack optimized code do some magic(e.g. double/sigle quote wrap),
  // separate content assignment to two line
  // use AssetReplacePlugin to replace pageprovider content
  const pageProviderURL = chrome.runtime.getURL('pageProvider.js');

  const outerContainer = document.head || document.documentElement;
  const outerScriptEle = document.createElement('script');
  
  const outerScript = `
if (!window.__RD_isDappSafeView && window.__RD_isDappView) {
  var container = document.head || document.documentElement;
  var ele = document.createElement('script');
  
  var __rabby__channelName = '${rabbyEnvInjection.channelName}';
  var __rabby__isDefaultWallet = ${rabbyEnvInjection.isDefaultWallet};
  var __rabby__uuid = '${rabbyEnvInjection.uuid}';
  var __rabby__isOpera = ${rabbyEnvInjection.isOpera};

  ele.setAttribute('src', '${pageProviderURL}');
  container.insertBefore(ele, container.children[0]);
  container.removeChild(ele);
}
`;
  outerScriptEle.textContent = outerScript;
  outerContainer.insertBefore(outerScriptEle, outerContainer.children[0]);
  outerContainer.removeChild(outerScriptEle);
};

const { BroadcastChannelMessage, PortMessage } = Message;

const pm = new PortMessage().connect();

const bcm = new BroadcastChannelMessage(channelName).listen((data) =>
  pm.request(data)
);

// background notification
pm.on('message', (data) => bcm.send('message', data));

document.addEventListener('beforeunload', () => {
  bcm.dispose();
  pm.dispose();
});

injectProviderScript();
