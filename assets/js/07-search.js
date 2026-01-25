let miniSearch = null;
let searchModal = null;
let searchInput = null;
let searchResults = null;
let isSearchReady = false;

async function initializeSearch() {
  if (isSearchReady) return;

  try {
    const response = await fetch('/index.json');
    const documents = await response.json();

    miniSearch = new MiniSearch({
      fields: ['title', 'content', 'summary'],
      storeFields: ['title', 'permalink', 'section', 'content', 'summary'],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
        prefix: true
      }
    });

    miniSearch.addAll(documents);

    isSearchReady = true;
  } catch (error) {
    console.error('Failed to load search index:', error);
  }
}

function openSearch() {
  if (!searchModal) return;

  searchModal.classList.add('is-active');
  searchInput.focus();
  document.body.style.overflow = 'hidden';

  if (!isSearchReady) {
    initializeSearch();
  }
}

function closeSearch() {
  if (!searchModal) return;

  clearTimeout(searchTimeout);

  clearPageHighlights();

  searchModal.classList.remove('is-active');
  searchInput.value = '';
  searchResults.innerHTML = '';
  document.body.style.overflow = '';
}

let searchTimeout;
function performSearch(query) {
  clearTimeout(searchTimeout);

  if (!query || query.length < 2) {
    searchResults.innerHTML = '';
    return;
  }

  searchTimeout = setTimeout(() => {
    if (!isSearchReady) return;

    const results = miniSearch.search(query, { 
      limit: 10 
    });

    displayResults(results, query);
  }, 200); // 200ms debounce
}

function displayResults(results, query) {
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
    return;
  }

  searchResults.innerHTML = results.map((result, idx) => {
    let preview = result.content || result.summary || '';
    preview = truncatePreview(preview, 80);

    preview = highlightMatches(preview, query);

    const section = result.section 
      ? formatSection(result.section) 
      : 'Documentation';

    const urlWithHash = result.permalink + '#search=' + encodeURIComponent(query);

    return `
      <a href="${escapeHtml(urlWithHash)}" class="search-result-item" data-index="${idx}">
        <div class="search-result-header">
          <div class="search-result-title">${escapeHtml(result.title)}</div>
          <div class="search-result-section">${section}</div>
        </div>
        <div class="search-result-preview">${preview}</div>
      </a>
    `;
  }).join('');
}

function truncatePreview(text, maxLength) {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return truncated.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
}

function highlightMatches(text, query) {
  if (!query || !text) return escapeHtml(text);

  const queryTrimmed = query.trim().replace(/\s+/g, ' ');
  if (!queryTrimmed) return escapeHtml(text);

  const searchRegex = new RegExp(escapeRegex(queryTrimmed), 'gi');
  let highlighted = '';
  let lastIndex = 0;
  let match;

  while ((match = searchRegex.exec(text)) !== null) {
    highlighted += escapeHtml(text.substring(lastIndex, match.index));
    highlighted += '<mark>' + escapeHtml(match[0]) + '</mark>';
    lastIndex = match.index + match[0].length;
  }

  highlighted += escapeHtml(text.substring(lastIndex));

  return highlighted;
}

function formatSection(section) {
  return section
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

document.addEventListener('keydown', (e) => {
  // Ctrl+K or Cmd+K to open
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }

  // Escape to close
  if (e.key === 'Escape' && searchModal?.classList.contains('is-active')) {
    closeSearch();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  searchModal = document.getElementById('search-modal');
  searchInput = document.getElementById('search-input');
  searchResults = document.getElementById('search-results');

  if (!searchModal || !searchInput || !searchResults) return;

  // Click outside to close
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      closeSearch();
    }
  });

  searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });

  highlightSearchTermsOnPage();
});

function clearPageHighlights() {
  const highlights = document.querySelectorAll('mark.search-highlight');
  highlights.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

function highlightSearchTermsOnPage() {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#search=')) return;

  try {
    const searchQuery = decodeURIComponent(hash.replace('#search=', ''));
    if (!searchQuery) return;

    clearPageHighlights();

    const contentArea = document.querySelector('.doc, article, main, .content') || document.body;
    if (!contentArea) return;

    highlightTermInElement(contentArea, searchQuery);

    setTimeout(() => {
      const firstMark = document.querySelector('mark.search-highlight');
      if (firstMark) {
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  } catch (error) {
    console.error('Error highlighting search terms:', error);
  }
}

function highlightTermInElement(element, searchTerm) {
  const skipTags = ['SCRIPT', 'STYLE', 'MARK'];
  if (skipTags.includes(element.tagName)) return;

  if (element.nodeType === Node.TEXT_NODE) {
    const text = element.textContent;
    const regex = new RegExp(escapeRegex(searchTerm), 'gi');

    if (regex.test(text)) {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      regex.lastIndex = 0; // Reset regex
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
        }

        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.textContent = match[0];
        fragment.appendChild(mark);

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      element.parentNode.replaceChild(fragment, element);
    }
  } else {
    const children = Array.from(element.childNodes);
    children.forEach(child => highlightTermInElement(child, searchTerm));
  }
}

window.openSearch = openSearch;
window.closeSearch = closeSearch;
