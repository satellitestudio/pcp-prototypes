import React, { useCallback, useMemo } from 'react'
import SearchComponent from './search'
import Downshift, { DownshiftState, StateChangeOptions } from 'downshift'
import { useResultsFiltered } from './search.hooks'

import data from '../../data/data'
import { DataItem } from '../../types/data'
import {
  replaceWithNormalSpaces,
  parseSelectionToInput,
  calculateCursorPosition,
  parseInputToFields,
} from './search.utils'
import { asyncFields } from './search.config'

interface SearchContainerProps {
  initialSelection: DataItem[]
  onChange(selectedItems: DataItem[], inputValue: string): void
}

const SearchContainer: React.FC<SearchContainerProps> = (props) => {
  let cursorPosition = 0
  const [state, dispatch] = useResultsFiltered(data, '')
  const { initialSelection, onChange } = props
  const { results, loading } = state

  const handleStateChange = useCallback(
    (changes: StateChangeOptions<DataItem[]>, downshiftState: DownshiftState<DataItem[]>) => {
      if (changes.hasOwnProperty('inputValue')) {
        const { inputValue = '', selectedItem } = downshiftState
        const inputValueString = inputValue || ''
        if (selectedItem !== null) {
          onChange(selectedItem, inputValueString)
          if (inputValue) {
            dispatch({
              type: 'inputChange',
              payload: { search: inputValueString, selectedItem, cursorPosition },
            })
          }
        }
      }
    },
    []
  )

  const handleConfirmSelection = (
    state: DownshiftState<any>,
    changes: StateChangeOptions<any>,
    lastCharacter: string = ' '
  ): StateChangeOptions<any> => {
    const currentItems = state.selectedItem || []
    const alreadySelected = currentItems.find(
      (item: DataItem) => item.id === changes.selectedItem.id
    )
    const selectedItem = alreadySelected ? currentItems : [...currentItems, changes.selectedItem]

    // Adding a space at the end to start with a clean search when press enter
    const inputValue = parseSelectionToInput(selectedItem, lastCharacter)
    return { ...changes, selectedItem, inputValue }
  }

  const getSelectedItemsByInput = (input: string, currentSelection: DataItem[]): DataItem[] => {
    const inputValuesParsed = input ? parseInputToFields(input) : null
    return inputValuesParsed !== null
      ? currentSelection.filter(
          (i: DataItem) =>
            inputValuesParsed.find(
              (p) => p.type === i.type && p.labels !== undefined && p.labels.includes(i.label)
            ) !== undefined
        )
      : []
  }

  const handleChangeInput = (
    state: DownshiftState<DataItem[]>,
    changes: StateChangeOptions<DataItem[]>
  ): StateChangeOptions<DataItem[]> => {
    cursorPosition = calculateCursorPosition(changes.inputValue || '', state.inputValue || '')
    const inputValue = changes.inputValue || ''
    let selectedItem = getSelectedItemsByInput(inputValue, state.selectedItem || [])
    if (inputValue) {
      // Remove from current when cursor is in last character to suggest
      let currentLabelEndIndex = cursorPosition + 1
      let currentLabelStartIndex = 0
      for (let i = cursorPosition; i > 0; i--) {
        if (inputValue[i] === ':' || inputValue[i] === ',') {
          currentLabelStartIndex = i + 1
          break
        }
      }
      const currentLabel = replaceWithNormalSpaces(
        inputValue.slice(currentLabelStartIndex, currentLabelEndIndex)
      )
      const currentSelection = selectedItem.find((i: DataItem) => i.label === currentLabel)
      // Removes the current selected when cursor is in last character to suggest properly
      // but don't do it when async as would need another fetch
      if (currentSelection && !asyncFields.includes(currentSelection.type)) {
        selectedItem = selectedItem.filter((item: DataItem) => item.id !== currentSelection.id)
      }
    }

    return { ...changes, selectedItem, isOpen: inputValue !== '' }
  }

  const stateReducer = useCallback(
    (
      state: DownshiftState<DataItem[]>,
      changes: StateChangeOptions<DataItem[]>
    ): StateChangeOptions<DataItem[]> => {
      switch (changes.type as any) {
        case Downshift.stateChangeTypes.keyDownEnter:
        case Downshift.stateChangeTypes.clickItem: {
          return handleConfirmSelection(state, changes)
        }
        case 'keyDownComa': {
          return handleConfirmSelection(state, changes, '')
        }
        case Downshift.stateChangeTypes.changeInput: {
          return handleChangeInput(state, changes)
        }
        default:
          // Avoids warning on uncontrolled input value
          return { ...changes, inputValue: changes.inputValue || state.inputValue || '' }
      }
    },
    []
  )

  const customKeyDownHandler = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>, downshift: any) => {
      const { highlightedIndex, inputValue, setState } = downshift
      const hasValue = inputValue !== '' && inputValue !== ' '
      const isSpace = event.key === ' '
      const isComma = event.key === ','
      const hasOneOptions = results.length === 1
      if (hasValue && ((isSpace || isComma) && hasOneOptions)) {
        ;(event as any).nativeEvent.preventDownshiftDefault = true
        if (highlightedIndex !== null && highlightedIndex >= 0) {
          const selectedItem = results[highlightedIndex]
          if (selectedItem) {
            setState({
              type: 'keyDownComa',
              selectedItem,
              inputValue,
            })
          }
        }
      }
    },
    [results]
  )

  const itemToString = useCallback((i: DataItem): string => {
    return i ? i.label : ''
  }, [])

  const initialInputValue = useMemo((): string => {
    return initialSelection !== null ? parseSelectionToInput(initialSelection) : ''
  }, [])

  return (
    <SearchComponent
      items={results}
      loading={loading}
      itemToString={itemToString}
      stateReducer={stateReducer}
      initialInputValue={initialInputValue}
      initialSelection={initialSelection}
      onKeyDown={customKeyDownHandler}
      onStateChange={handleStateChange}
    />
  )
}

export default SearchContainer
