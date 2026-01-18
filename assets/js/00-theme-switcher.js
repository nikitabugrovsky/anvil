;(function () {
  'use strict'

  var STORAGE_KEY = 'theme-preference'

  function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function getSavedPreference() {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch (e) {
      return null
    }
  }

  function getActiveTheme() {
    return getSavedPreference() || getSystemPreference()
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
  }

  function setTheme(theme) {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (e) {
      // localStorage might be disabled
    }
  }

  function toggleTheme() {
    var currentTheme = getActiveTheme()
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  applyTheme(getActiveTheme())

  if (!getSavedPreference()) {
    var darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener('change', function (e) {
        if (!getSavedPreference()) {
          applyTheme(e.matches ? 'dark' : 'light')
        }
      })
    }
  }

  window.toggleTheme = toggleTheme
})()
