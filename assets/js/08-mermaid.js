;(function () {
  'use strict'
  
  // Determine current theme from data-theme attribute
  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light'
  }
  
  // Map theme to Mermaid theme names
  function getMermaidTheme(theme) {
    return theme === 'dark' ? 'dark' : 'default'
  }
  
  // Initialize Mermaid with current theme
  function initMermaid() {
    if (typeof mermaid === 'undefined') {
      return
    }
    
    const theme = getCurrentTheme()
    mermaid.initialize({
      startOnLoad: true,
      theme: getMermaidTheme(theme),
      securityLevel: 'loose',
      fontFamily: 'inherit'
    })
  }
  
  // Save original diagram content before first render
  function saveOriginalContent() {
    document.querySelectorAll('.mermaid').forEach(function(element) {
      if (!element.hasAttribute('data-original')) {
        element.setAttribute('data-original', element.textContent)
      }
    })
  }
  
  // Re-render diagrams when theme changes
  function reRenderDiagrams() {
    if (typeof mermaid === 'undefined') {
      return
    }
    
    const newTheme = getCurrentTheme()
    mermaid.initialize({ 
      theme: getMermaidTheme(newTheme),
      securityLevel: 'loose',
      fontFamily: 'inherit'
    })
    
    // Restore original content and re-render
    document.querySelectorAll('.mermaid').forEach(function(element, index) {
      const originalContent = element.getAttribute('data-original')
      if (originalContent) {
        // Clear processed content
        element.innerHTML = originalContent
        element.removeAttribute('data-processed')
        
        // Re-render with new theme
        mermaid.run({
          nodes: [element]
        })
      }
    })
  }
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      saveOriginalContent()
      initMermaid()
    })
  } else {
    saveOriginalContent()
    initMermaid()
  }
  
  // Listen for theme change events
  window.addEventListener('themeChanged', reRenderDiagrams)
})()
