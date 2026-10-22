/**
 * Reusable GOV.UK form enhancements
 *
 * .js-typeahead
 * Enhances a GOV.UK radio group into a searchable single-select.
 *
 * .js-multiselect
 * Enhances a GOV.UK checkbox group into a searchable multi-select.
 *
 * The original controls remain in the page and are kept in sync. Forms
 * therefore continue to submit their original names and values. Without
 * JavaScript, the standard GOV.UK controls remain available.
 *
 * Multiselect options:
 *
 * data-options-search-label
 * Sets the visible label for the search input. Default: "Search".
 *
 * data-options-search-placeholder
 * Sets the placeholder for the search input. Default: "Search".
 *
 * data-options-show-selected-items
 * Shows a list of selected items when set to "true". Default: false.
 *
 * data-options-show-dropdown-arrow
 * Shows a button for opening and closing the options. Default: false.
 *
 * data-options-show-dropdown-list-on-focus
 * Opens the options when the search input receives focus. Default: false.
 *
 * Existing multiselect options:
 *
 * data-multiselect-sections
 * Groups options using their data-section values when set to "true".
 *
 * data-multiselect-search
 * Hides the search input and uses a filter-style trigger when set to "false".
 *
 * data-multiselect-trigger
 * Sets the default text for the no-search filter trigger. Default: "All".
 */

;(function () {
  'use strict'

  var instanceCounter = 0

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.js-typeahead').forEach(initialiseTypeahead)
    document.querySelectorAll('.js-multiselect').forEach(initialiseMultiselect)
  })

  function uniqueId(prefix) {
    instanceCounter += 1
    return prefix + '-' + instanceCounter
  }

  function getLabelText(container, input) {
    var label = container.querySelector('label[for="' + input.id + '"]')
    return label ? label.textContent.trim() : input.value
  }

  function dispatchChange(control) {
    control.dispatchEvent(new Event('change', { bubbles: true }))
  }

  function setClearButtonVisibility(button, input) {
    button.hidden = input.value.trim() === ''
  }

  // ---------------------------------------------------------------------------
  // Radio typeahead
  // ---------------------------------------------------------------------------

  function initialiseTypeahead(source) {
    if (source.dataset.enhanced === 'true') return

    var originalInputs = Array.from(
      source.querySelectorAll('input[type="radio"]')
    )

    if (!originalInputs.length) return

    source.dataset.enhanced = 'true'

    var componentId = uniqueId('typeahead')
    var placeholder = source.dataset.typeaheadPlaceholder || 'Search'
    var searchLabelText = source.dataset.typeaheadLabel || 'Search'

    var items = originalInputs.map(function (input) {
      return {
        text: getLabelText(source, input),
        value: input.value,
        selected: input.checked,
        originalControl: input
      }
    })

    var wrapper = document.createElement('div')
    wrapper.className = 'typeahead'

    var searchGroup = document.createElement('div')
    searchGroup.className = 'govuk-form-group typeahead__search-group'

    var searchLabel = document.createElement('label')
    searchLabel.className = 'govuk-label'
    searchLabel.htmlFor = componentId + '-search'
    searchLabel.textContent = searchLabelText

    var searchContainer = document.createElement('div')
    searchContainer.className = 'typeahead__search-container'

    var search = document.createElement('input')
    search.className = 'govuk-input typeahead__search-input'
    search.id = componentId + '-search'
    search.type = 'text'
    search.autocomplete = 'off'
    search.placeholder = placeholder
    search.setAttribute('aria-controls', componentId + '-results')
    search.setAttribute('aria-expanded', 'false')

    var clearSearch = document.createElement('button')
    clearSearch.className = 'typeahead__clear-search'
    clearSearch.type = 'button'
    clearSearch.setAttribute(
      'aria-label',
      'Clear search and selected option'
    )
    clearSearch.innerHTML = '×'

    var results = document.createElement('div')
    results.className = 'typeahead__results'
    results.id = componentId + '-results'
    results.hidden = true

    searchContainer.appendChild(search)
    searchContainer.appendChild(clearSearch)

    searchGroup.appendChild(searchLabel)
    searchGroup.appendChild(searchContainer)

    wrapper.appendChild(searchGroup)
    wrapper.appendChild(results)

    source.insertAdjacentElement('afterend', wrapper)
    source.classList.add('enhanced-control--hidden')

    function clearSelection() {
      items.forEach(function (item) {
        item.selected = false
        item.originalControl.checked = false
        dispatchChange(item.originalControl)
      })
    }

    function selectItem(item) {
      clearSelection()

      item.selected = true
      item.originalControl.checked = true
      dispatchChange(item.originalControl)

      search.value = item.text
      setClearButtonVisibility(clearSearch, search)
      closeResults()
    }

    function filteredItems() {
      var term = search.value.trim().toLowerCase()

      if (!term) return items

      return items.filter(function (item) {
        return item.text.toLowerCase().includes(term)
      })
    }

    function openResults() {
      results.hidden = false
      search.setAttribute('aria-expanded', 'true')
    }

    function closeResults() {
      results.hidden = true
      search.setAttribute('aria-expanded', 'false')
    }

    function renderResults() {
      var matches = filteredItems()

      results.innerHTML = ''

      if (!matches.length) {
        var noResults = document.createElement('p')
        noResults.className = 'govuk-body-s typeahead__no-results'
        noResults.textContent = 'No matching results'

        results.appendChild(noResults)
        openResults()
        return
      }

      var group = document.createElement('div')
      group.className = 'govuk-radios govuk-radios--small'

      matches.forEach(function (item, index) {
        var id = componentId + '-option-' + index

        var row = document.createElement('div')
        row.className = 'govuk-radios__item'

        var input = document.createElement('input')
        input.className = 'govuk-radios__input'
        input.id = id
        input.name = componentId + '-generated'
        input.type = 'radio'
        input.checked = item.selected

        var label = document.createElement('label')
        label.className = 'govuk-label govuk-radios__label'
        label.htmlFor = id
        label.textContent = item.text

        input.addEventListener('change', function () {
          if (input.checked) selectItem(item)
        })

        row.appendChild(input)
        row.appendChild(label)
        group.appendChild(row)
      })

      results.appendChild(group)
      openResults()
    }

    search.addEventListener('focus', renderResults)

    search.addEventListener('input', function () {
      setClearButtonVisibility(clearSearch, search)
      renderResults()
    })

    clearSearch.addEventListener('click', function () {
      clearSelection()

      search.value = ''
      setClearButtonVisibility(clearSearch, search)
      renderResults()
      search.focus()
    })

    search.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeResults()
      }
    })

    document.addEventListener('click', function (event) {
      if (!wrapper.contains(event.target)) {
        closeResults()
      }
    })

    var initiallySelected = items.find(function (item) {
      return item.selected
    })

    if (initiallySelected) {
      search.value = initiallySelected.text
    }

    setClearButtonVisibility(clearSearch, search)
  }

  // ---------------------------------------------------------------------------
  // Checkbox multiselect
  // ---------------------------------------------------------------------------

  function initialiseMultiselect(source) {
    if (source.dataset.enhanced === 'true') return

    var originalInputs = Array.from(
      source.querySelectorAll('input[type="checkbox"]')
    )

    if (!originalInputs.length) return

    source.dataset.enhanced = 'true'

    var componentId = uniqueId('multiselect')

    var useSections =
      source.dataset.multiselectSections === 'true'

    var showSearch =
      source.dataset.multiselectSearch !== 'false'

    var showSelectedItems =
      source.dataset.optionsShowSelectedItems === 'true'

    var showDropdownArrow =
      source.dataset.optionsShowDropdownArrow !== 'false'

    var showDropdownListOnFocus =
      source.dataset.optionsShowDropdownListOnFocus === 'true'

    var placeholder =
      source.dataset.optionsSearchPlaceholder || 'Search'

    var searchLabelText =
      source.dataset.optionsSearchLabel || 'Search'

    var defaultTriggerText =
      source.dataset.multiselectTrigger || 'All'

    /*
     * The options behave as a dropdown. They are initially hidden and can be
     * opened by typing, focusing the search input where configured, selecting
     * the arrow where configured, or using the no-search trigger.
     */
    var isDropdown = true

    /*
     * Without a search input, the filter trigger becomes the control used to
     * open and close the list. Search-specific options do not apply.
     */
    if (!showSearch) {
      showDropdownArrow = false
      showDropdownListOnFocus = false
    }

    var items = []
    var otherItem = null

    originalInputs.forEach(function (input) {
      var text = getLabelText(source, input)
      var itemWrapper = input.closest('.govuk-checkboxes__item')
      var conditional = null

      if (
        itemWrapper &&
        itemWrapper.nextElementSibling &&
        itemWrapper.nextElementSibling.classList.contains(
          'govuk-checkboxes__conditional'
        )
      ) {
        conditional = itemWrapper.nextElementSibling
      }

      var isOther =
        input.dataset.multiselectOther === 'true' ||
        input.value.toLowerCase() === 'other' ||
        text.toLowerCase() === 'other'

      var item = {
        text: text,
        value: input.value,
        selected: input.checked,
        section: input.dataset.section || '',
        originalControl: input,
        itemWrapper: itemWrapper,
        conditional: conditional
      }

      if (isOther) {
        otherItem = item
      } else {
        items.push(item)
      }
    })

    var wrapper = document.createElement('div')
    wrapper.className = 'multiselect multiselect--dropdown'

    if (showDropdownArrow) {
      wrapper.classList.add('multiselect--dropdown-arrow')
    }

    if (!showSearch) {
      wrapper.classList.add('multiselect--no-search')
    }

    var selectedContainer = document.createElement('div')
    selectedContainer.className = 'multiselect__selected'

    var controlContainer = document.createElement('div')
    controlContainer.className = 'multiselect__control'

    var searchGroup = document.createElement('div')
    searchGroup.className =
      'govuk-form-group multiselect__search-group'

    var searchLabel = document.createElement('label')
    searchLabel.className = 'govuk-label'
    searchLabel.htmlFor = componentId + '-search'
    searchLabel.textContent = searchLabelText

    var searchContainer = document.createElement('div')
    searchContainer.className = 'multiselect__search-container'

    var search = document.createElement('input')
    search.className = 'govuk-input multiselect__search-input'
    search.id = componentId + '-search'
    search.type = 'text'
    search.autocomplete = 'off'
    search.placeholder = placeholder
    search.setAttribute('aria-controls', componentId + '-results')
    search.setAttribute('aria-expanded', 'false')

    var clearSearch = document.createElement('button')
    clearSearch.className = 'multiselect__clear-search'
    clearSearch.type = 'button'
    clearSearch.setAttribute('aria-label', 'Clear search')
    clearSearch.innerHTML = '×'

    var dropdownToggle = document.createElement('button')
    dropdownToggle.className = 'multiselect__dropdown-toggle'
    dropdownToggle.type = 'button'
    dropdownToggle.setAttribute('aria-label', 'Show options')
    dropdownToggle.setAttribute('aria-expanded', 'false')
    dropdownToggle.setAttribute(
      'aria-controls',
      componentId + '-results'
    )

    var filterTrigger = document.createElement('button')
    filterTrigger.className = 'multiselect__filter-trigger'
    filterTrigger.type = 'button'
    filterTrigger.setAttribute('aria-expanded', 'false')
    filterTrigger.setAttribute(
      'aria-controls',
      componentId + '-results'
    )

    var filterTriggerText = document.createElement('span')
    filterTriggerText.className =
      'multiselect__filter-trigger-text'
    filterTriggerText.textContent = defaultTriggerText

    var filterTriggerChevron = document.createElement('span')
    filterTriggerChevron.className =
      'multiselect__filter-trigger-chevron'
    filterTriggerChevron.setAttribute('aria-hidden', 'true')

    filterTrigger.appendChild(filterTriggerText)
    filterTrigger.appendChild(filterTriggerChevron)

    var results = document.createElement('div')
    results.className = 'multiselect__results'
    results.id = componentId + '-results'
    results.hidden = true

    if (showSelectedItems) {
      wrapper.appendChild(selectedContainer)
    }

    if (showSearch) {
      searchContainer.appendChild(search)
      searchContainer.appendChild(clearSearch)

      if (showDropdownArrow) {
        searchContainer.appendChild(dropdownToggle)
      }

      searchGroup.appendChild(searchLabel)
      searchGroup.appendChild(searchContainer)
      controlContainer.appendChild(searchGroup)
    } else {
      controlContainer.appendChild(filterTrigger)
    }

    wrapper.appendChild(controlContainer)
    wrapper.appendChild(results)

    source.insertAdjacentElement('afterend', wrapper)

    if (otherItem && otherItem.itemWrapper) {
      var otherContainer = document.createElement('div')
      otherContainer.className = 'multiselect__other'

      var otherGroup = document.createElement('div')
      otherGroup.className =
        'govuk-checkboxes govuk-checkboxes--small'

      otherGroup.appendChild(otherItem.itemWrapper)
      otherContainer.appendChild(otherGroup)

      if (otherItem.conditional) {
        otherContainer.appendChild(otherItem.conditional)
      }

      wrapper.appendChild(otherContainer)
    }

    source.classList.add('enhanced-control--hidden')

    function selectedItems() {
      return items.filter(function (item) {
        return item.selected
      })
    }

    function syncOriginal(item) {
      item.originalControl.checked = item.selected
      dispatchChange(item.originalControl)
    }

    function updateClearButton() {
      if (showSearch) {
        setClearButtonVisibility(clearSearch, search)
      }
    }

    function updateFilterTrigger() {
      if (showSearch) return

      var selected = selectedItems()

      if (!selected.length) {
        filterTriggerText.textContent = defaultTriggerText
      } else if (selected.length <= 2) {
        filterTriggerText.textContent = selected
          .map(function (item) {
            return item.text
          })
          .join(', ')
      } else {
        filterTriggerText.textContent =
          selected.length + ' selected'
      }

      filterTrigger.classList.toggle(
        'multiselect__filter-trigger--active',
        selected.length > 0
      )
    }

    function renderSelectedItems() {
      if (!showSelectedItems) return

      selectedContainer.innerHTML = ''

      var heading = document.createElement('h3')
      heading.className = 'govuk-heading-s'
      heading.textContent = 'Selected items'

      selectedContainer.appendChild(heading)

      var selected = selectedItems()

      if (!selected.length) {
        var none = document.createElement('p')
        none.className = 'govuk-body-s'
        none.textContent = 'None'

        selectedContainer.appendChild(none)
        return
      }

      var list = document.createElement('ul')
      list.className =
        'govuk-list multiselect__selected-list'

      selected.forEach(function (item) {
        var row = document.createElement('li')
        row.className = 'multiselect__selected-item'

        var text = document.createElement('span')
        text.textContent = item.text

        var remove = document.createElement('button')
        remove.className = 'govuk-link multiselect__remove'
        remove.type = 'button'
        remove.textContent = 'Remove'
        remove.setAttribute(
          'aria-label',
          'Remove ' + item.text
        )

        remove.addEventListener('click', function () {
          item.selected = false
          syncOriginal(item)
          renderSelectedItems()
          updateFilterTrigger()
          renderResults()
        })

        row.appendChild(text)
        row.appendChild(remove)
        list.appendChild(row)
      })

      selectedContainer.appendChild(list)
    }

    function openResults() {
      results.hidden = false
      wrapper.classList.add('multiselect--open')

      if (showSearch) {
        search.setAttribute('aria-expanded', 'true')
      }

      if (showDropdownArrow && showSearch) {
        dropdownToggle.setAttribute('aria-expanded', 'true')
        dropdownToggle.setAttribute(
          'aria-label',
          'Hide options'
        )
      }

      if (!showSearch) {
        filterTrigger.setAttribute('aria-expanded', 'true')
      }
    }

    function closeResults() {
      results.hidden = true
      wrapper.classList.remove('multiselect--open')

      if (showSearch) {
        search.setAttribute('aria-expanded', 'false')
      }

      if (showDropdownArrow && showSearch) {
        dropdownToggle.setAttribute('aria-expanded', 'false')
        dropdownToggle.setAttribute(
          'aria-label',
          'Show options'
        )
      }

      if (!showSearch) {
        filterTrigger.setAttribute('aria-expanded', 'false')
      }
    }

    function toggleResults() {
      if (results.hidden) {
        renderResults()
        openResults()
      } else {
        closeResults()
      }
    }

    function buildOption(item, index, idPrefix) {
      var id =
        componentId + '-' + idPrefix + '-' + index

      var row = document.createElement('div')
      row.className = 'govuk-checkboxes__item'

      var input = document.createElement('input')
      input.className = 'govuk-checkboxes__input'
      input.id = id
      input.type = 'checkbox'
      input.checked = item.selected

      var label = document.createElement('label')
      label.className =
        'govuk-label govuk-checkboxes__label'
      label.htmlFor = id
      label.textContent = item.text

      input.addEventListener('change', function () {
        item.selected = input.checked
        syncOriginal(item)
        renderSelectedItems()
        updateFilterTrigger()

        /*
         * Do not call renderResults() here. Rebuilding the results would
         * remove the focused checkbox and cause keyboard focus to be lost.
         */
      })

      row.appendChild(input)
      row.appendChild(label)

      return row
    }

    function renderResults() {
      var term = showSearch
        ? search.value.trim().toLowerCase()
        : ''

      var visible = items.filter(function (item) {
        return (
          !term ||
          item.text.toLowerCase().includes(term)
        )
      })

      results.innerHTML = ''

      if (!visible.length) {
        var noResults = document.createElement('p')
        noResults.className =
          'govuk-body-s multiselect__no-results'
        noResults.textContent = 'No matching results'

        results.appendChild(noResults)
        return
      }

      if (!useSections) {
        var group = document.createElement('div')
        group.className =
          'govuk-checkboxes govuk-checkboxes--small'

        visible.forEach(function (item, index) {
          group.appendChild(
            buildOption(item, index, 'option')
          )
        })

        results.appendChild(group)
        return
      }

      var grouped = {}
      var order = []

      visible.forEach(function (item) {
        var section = item.section || 'Other'

        if (!grouped[section]) {
          grouped[section] = []
          order.push(section)
        }

        grouped[section].push(item)
      })

      order.forEach(function (section, sectionIndex) {
        var heading = document.createElement('h3')
        heading.className =
          'govuk-heading-s multiselect__section-heading'
        heading.textContent = section

        results.appendChild(heading)

        var group = document.createElement('div')
        group.className =
          'govuk-checkboxes govuk-checkboxes--small'

        grouped[section].forEach(function (item, itemIndex) {
          group.appendChild(
            buildOption(
              item,
              itemIndex,
              'section-' + sectionIndex
            )
          )
        })

        results.appendChild(group)
      })
    }

    if (
      otherItem &&
      otherItem.originalControl &&
      otherItem.conditional
    ) {
      function updateOtherConditional() {
        var checked =
          otherItem.originalControl.checked

        otherItem.conditional.hidden = !checked

        otherItem.conditional.classList.toggle(
          'govuk-checkboxes__conditional--hidden',
          !checked
        )
      }

      otherItem.originalControl.addEventListener(
        'change',
        updateOtherConditional
      )

      updateOtherConditional()
    }

    if (showSearch) {
      search.addEventListener('focus', function () {
        if (showDropdownListOnFocus) {
          renderResults()
          openResults()
        }
      })

      search.addEventListener('input', function () {
        updateClearButton()
        renderResults()
        openResults()
      })

      clearSearch.addEventListener('click', function () {
        var wasOpen = !results.hidden

        search.value = ''
        updateClearButton()
        renderResults()

        if (wasOpen) {
          openResults()
        } else {
          closeResults()
        }

        search.focus()
      })

      if (showDropdownArrow) {
        dropdownToggle.addEventListener('click', function () {
          toggleResults()
          search.focus()
        })
      }

      search.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          closeResults()
        }
      })
    } else {
      filterTrigger.addEventListener(
        'click',
        toggleResults
      )

      filterTrigger.addEventListener(
        'keydown',
        function (event) {
          if (event.key === 'Escape') {
            closeResults()
          }
        }
      )
    }

    document.addEventListener('click', function (event) {
      if (
        isDropdown &&
        !wrapper.contains(event.target)
      ) {
        closeResults()
      }
    })

    renderSelectedItems()
    updateFilterTrigger()
    updateClearButton()
  }
})()