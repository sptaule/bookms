browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.type === 'search') {
    searchBookmarks(message.query).then((results) => {
      sendResponse({ results });
    });
    return true;
  }

  if (message.type === 'openTab') {
    browser.tabs.create({ url: message.url });
  }

});

function searchBookmarks(query) {
  return browser.bookmarks.search(query).then((bookmarks) => {
    return bookmarks.filter(bookmark => bookmark.url);
  });
}