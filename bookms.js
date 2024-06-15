let shiftPressedTime = 0;
let popupIsOpen = false;
let currentIndex = -1;
let previousActiveElement = null;

const selectors = {
  searchInput: '#search-input',
  popupContainer: '#popup-container',
  popup: '#bookmark-search-popup',
  searchResults: '#search-results',
  bookmarkUrlSpan: '#bookmark-url'
};

document.addEventListener('keydown', handleShiftPress);

function handleShiftPress(event) {
  if (event.key === 'Shift') {
    const currentTime = new Date().getTime();
    if (currentTime - shiftPressedTime < 300) {
      popupIsOpen ? closePopup() : showPopup();
    }
    shiftPressedTime = currentTime;
  }
}

function showPopup() {
  if (popupIsOpen) return;

  const existingPopup = document.querySelector(selectors.popup);
  if (existingPopup) return;

  const popupContainer = document.createElement('div');
  popupContainer.id = 'popup-container';

  previousActiveElement = document.activeElement;

  const popupCloseBtn = document.createElement('button');
  popupCloseBtn.id = 'popup-close-btn';
  popupCloseBtn.innerHTML = `
  	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 0.5);">
  		<path d="m16.192 6.344-4.243 4.242-4.242-4.242-1.414 1.414L10.535 12l-4.242 4.242 1.414 1.414 4.242-4.242 4.243 4.242 1.414-1.414L13.364 12l4.242-4.242z"></path>
  	</svg>
  `;
  popupCloseBtn.addEventListener('click', closePopup);

  const popup = document.createElement('div');
  popup.id = 'bookmark-search-popup';
  popup.innerHTML = `
    <div id="popup-content">
      <input type="text" id="search-input" placeholder="Search bookmarks..." autofocus />
      <div id="search-results"></div>
      <span id="bookmark-url"></span>
    </div>
  `;

  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.textContent = `
    #popup-container {
			width: 100%;
			height: 100%;
			position: fixed;
			z-index: 9998 !important;
			top: 0;
      left: 0;
      background: rgba(0,0,0,0.1);
      backdrop-filter: blur(7px);
		}
		#popup-close-btn {
			position: fixed;
			z-index: 9998 !important;
			top: 20%;
      left: 50%;
      transform: translateX(-50%);
			height: 40px !important;
			width: 40px !important;
			border-radius: 50% !important;
			background: white !important;
			padding: 8px;
		}
		#popup-close-btn:hover svg {
			fill: black !important;
		}
    #bookmark-search-popup {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: white !important;
      border: 1px solid #CCC !important;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1) !important;
      z-index: 9999 !important;
      width: 500px !important;
      height: max-content !important;
      padding: 10px !important;
      border-radius: 8px !important;
    }
    #popup-content {
      display: flex !important;
      flex-direction: column !important;
      position: relative !important;
    }
    #search-input {
      padding: 10px !important;
      font-size: 16px !important;
      background: white !important;
      color: black !important;
      border-radius: 4px !important;
      border: solid 1px transparent !important;
    }
    #search-results {
    	margin-top: 10px !important;
      height: 375px !important;
      max-height: 375px !important;
      overflow-y: auto !important;
      scrollbar-color: #CCC #F0F0F0 !important;
    	scrollbar-width: thin !important;
    }
    .result-item {
    	white-space: nowrap !important;
		  overflow: hidden !important;
		  text-overflow: ellipsis !important;
      padding: 5px 4px !important;
      border-radius: 4px !important;
      display: block !important;
      width: 100% !important;
      font-size: 0.9rem !important;
    }
    .result-item:hover {
      background: #CCC !important;
    }
    .result-item.selected {
      background-color: #E8E8E8 !important;
    }
    .result-item a {
      text-decoration: none !important;
      color: #181818 !important;
    }
    #bookmark-url {
    	display: none;
    	background: #E1E7D9 !important;
    	color: #368156 !important;
    	font-size: 0.9rem !important;
    	padding: 7px 4px !important;
    	white-space: nowrap !important;
		  overflow: hidden !important;
		  text-overflow: ellipsis !important;
		  margin-top: 10px !important;
		  border-radius: 8px !important;
    }
  `;
  document.head.appendChild(styleSheet);

  popupContainer.appendChild(popupCloseBtn);
  popupContainer.appendChild(popup);

  document.body.appendChild(popupContainer);

  const searchInput = document.querySelector(selectors.searchInput);
  searchInput.addEventListener('input', searchBookmarks);
  searchInput.addEventListener('keydown', navigateResults);
  searchInput.addEventListener('keydown', closeOnEscape);

  document.addEventListener('click', handleOutsideClick);

  searchInput.focus();
  popupIsOpen = true;
}

function closeOnEscape(event) {
  if (event.key === 'Escape') {
    closePopup();
  }
}

function handleOutsideClick(event) {
  const popupContainer = document.querySelector(selectors.popupContainer);
  if (popupContainer && event.target.id !== 'search-input' && !popupContainer.contains(event.target)) {
    closePopup();
  }
}

function searchBookmarks() {
  const query = document.querySelector(selectors.searchInput).value.toLowerCase();
  if (query) {
    browser.runtime.sendMessage({ type: 'search', query }).then((response) => {
      displayResults(response.results);
    });
  } else {
    document.querySelector(selectors.searchResults).innerHTML = '';
  }
}

browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'results') {
    displayResults(message.results);
  }
});

function displayResults(results) {
  const resultsDiv = document.querySelector(selectors.searchResults);
  resultsDiv.innerHTML = '';

  results = results.filter(bookmark => bookmark.title && bookmark.url);

  results.forEach((bookmark, index) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    const anchor = document.createElement('a');
    anchor.href = bookmark.url;
    anchor.title = bookmark.url;
    anchor.target = '_blank';
    anchor.textContent = bookmark.title;

    anchor.addEventListener('click', () => window.open(bookmark.url, '_blank'));

    div.appendChild(anchor);
    div.dataset.index = index;
    resultsDiv.appendChild(div);
  });

  currentIndex = -1;
}

function navigateResults(event) {
  const resultsDiv = document.querySelector(selectors.searchResults);
  const items = resultsDiv.getElementsByClassName('result-item');

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (event.key === 'ArrowDown') {
      currentIndex = Math.min(currentIndex + 1, items.length - 1);
    } else if (event.key === 'ArrowUp') {
      currentIndex = Math.max(currentIndex - 1, 0);
    }
    updateSelection(items);
  } else if (event.key === 'Enter' && currentIndex > -1 && items[currentIndex]) {
    const url = items[currentIndex].querySelector('a').href;
    browser.runtime.sendMessage({ type: 'openTab', url });
    closePopup();
  }
}

function updateSelection(items) {
  const bookmarkUrlSpan = document.querySelector(selectors.bookmarkUrlSpan);
  bookmarkUrlSpan.style.display = 'block';

  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove('selected');
  }

  if (currentIndex > -1 && items[currentIndex]) {
    items[currentIndex].classList.add('selected');
    items[currentIndex].scrollIntoView({ block: 'nearest' });

    const url = items[currentIndex].querySelector('a').href;
    bookmarkUrlSpan.textContent = url;
  } else {
    bookmarkUrlSpan.textContent = '';
  }
}

function closePopup() {
  const popupContainer = document.querySelector(selectors.popupContainer);
  if (popupContainer) {
    popupContainer.parentNode.removeChild(popupContainer);
    popupIsOpen = false;
    currentIndex = -1;
  }
  if (previousActiveElement) {
    previousActiveElement.focus();
    previousActiveElement = null;
  }
}