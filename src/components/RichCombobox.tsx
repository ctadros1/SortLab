import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { filterRichOptions, nextEnabledIndex, type RichOption } from '../ui/combobox'
import { AppIcon, ChevronDown } from './Icon'

interface Props<T extends RichOption> {
  label: string
  value: string
  options: T[]
  onChange: (value: string) => void
  renderSelected: (option: T) => ReactNode
  renderOption: (option: T, selected: boolean) => ReactNode
  searchPlaceholder?: string
  searchable?: boolean
  disabled?: boolean
  prominent?: boolean
  portal?: boolean
}

export function RichCombobox<T extends RichOption>({
  label,
  value,
  options,
  onChange,
  renderSelected,
  renderOption,
  searchPlaceholder,
  searchable = true,
  disabled = false,
  prominent = false,
  portal = false,
}: Props<T>) {
  const id = useId().replace(/:/g, '')
  const listboxId = `${id}-listbox`
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const typeaheadRef = useRef('')
  const typeaheadTimerRef = useRef<number | undefined>(undefined)
  const restoreFocusRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>()
  const filtered = useMemo(
    () => (searchable ? filterRichOptions(options, query) : options),
    [options, query, searchable],
  )
  const selected = options.find((option) => option.id === value) ?? options[0]
  const selectedIndex = Math.max(
    0,
    filtered.findIndex((option) => option.id === value),
  )
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const firstEnabledIndex = filtered.findIndex((option) => !option.disabled)
  const effectiveActiveIndex =
    filtered[activeIndex] && !filtered[activeIndex].disabled ? activeIndex : firstEnabledIndex

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!wrapperRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    if (searchable) window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, searchable])

  const positionPopover = useCallback(() => {
    if (!open || !portal || !triggerRef.current) return

    const trigger = triggerRef.current.getBoundingClientRect()
    const viewportPadding = 12
    const gap = 7
    const width = Math.min(520, window.innerWidth - viewportPadding * 2)
    const left = Math.min(
      Math.max(viewportPadding, trigger.left),
      window.innerWidth - width - viewportPadding,
    )
    const spaceBelow = window.innerHeight - trigger.bottom - gap - viewportPadding
    const spaceAbove = trigger.top - gap - viewportPadding
    const placeAbove = spaceBelow < 320 && spaceAbove > spaceBelow
    const availableHeight = placeAbove ? spaceAbove : spaceBelow

    setPopoverStyle({
      position: 'fixed',
      top: placeAbove ? 'auto' : trigger.bottom + gap,
      right: 'auto',
      bottom: placeAbove ? window.innerHeight - trigger.top + gap : 'auto',
      left,
      width,
      maxHeight: Math.min(620, Math.max(80, availableHeight)),
    })
  }, [open, portal])

  useLayoutEffect(() => {
    if (!open || !portal) return
    positionPopover()
    window.addEventListener('resize', positionPopover)
    window.addEventListener('scroll', positionPopover, true)
    return () => {
      window.removeEventListener('resize', positionPopover)
      window.removeEventListener('scroll', positionPopover, true)
    }
  }, [open, portal, positionPopover])

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current) window.clearTimeout(typeaheadTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!open && restoreFocusRef.current) {
      triggerRef.current?.focus()
      restoreFocusRef.current = false
    }
  }, [open])

  const close = (restoreFocus = true) => {
    if (typeaheadTimerRef.current) window.clearTimeout(typeaheadTimerRef.current)
    typeaheadRef.current = ''
    restoreFocusRef.current = restoreFocus
    setOpen(false)
    setQuery('')
  }

  const choose = (option: T) => {
    if (option.disabled) return
    onChange(option.id)
    close()
  }

  const move = (direction: 1 | -1) => {
    setActiveIndex((current) => nextEnabledIndex(filtered, current, direction))
  }

  const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) setOpen(true)
      else move(event.key === 'ArrowDown' ? 1 : -1)
      return
    }
    if (event.key === 'Home' && open) {
      event.preventDefault()
      setActiveIndex(filtered.findIndex((option) => !option.disabled))
      return
    }
    if (event.key === 'End' && open) {
      event.preventDefault()
      for (let index = filtered.length - 1; index >= 0; index -= 1) {
        if (!filtered[index].disabled) {
          setActiveIndex(index)
          break
        }
      }
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (!open) setOpen(true)
      else if (effectiveActiveIndex >= 0 && filtered[effectiveActiveIndex])
        choose(filtered[effectiveActiveIndex])
      return
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      close()
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (searchable && event.currentTarget === searchRef.current) return
      event.preventDefault()
      if (searchable) {
        if (!open) {
          setQuery(event.key)
          setOpen(true)
        }
        return
      }

      if (typeaheadTimerRef.current) window.clearTimeout(typeaheadTimerRef.current)
      typeaheadRef.current += event.key.toLowerCase()
      const matchIndex = options.findIndex(
        (option) =>
          !option.disabled && option.searchText.toLowerCase().includes(typeaheadRef.current),
      )
      if (matchIndex >= 0) setActiveIndex(matchIndex)
      if (!open) setOpen(true)
      typeaheadTimerRef.current = window.setTimeout(() => {
        typeaheadRef.current = ''
      }, 700)
    }
  }

  const groups = [...new Set(filtered.map((option) => option.group))]
  const activeOption = effectiveActiveIndex >= 0 ? filtered[effectiveActiveIndex] : undefined
  const popover = open ? (
    <div
      ref={popoverRef}
      className={`rich-select__popover ${portal ? 'rich-select__popover--viewport' : ''}`}
      style={portal ? popoverStyle : undefined}
    >
      {searchable ? (
        <label className="rich-select__search">
          <AppIcon name="search" aria-hidden="true" />
          <span className="sr-only">Search {label.toLowerCase()}</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder={searchPlaceholder}
            aria-controls={listboxId}
            aria-activedescendant={activeOption ? `${id}-option-${activeOption.id}` : undefined}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeys}
          />
        </label>
      ) : null}
      <div className="rich-select__list" role="listbox" id={listboxId} aria-label={label}>
        {groups.length === 0 ? (
          <p className="rich-select__empty">No matching options.</p>
        ) : (
          groups.map((group) => (
            <div
              className="rich-select__group"
              role="group"
              aria-labelledby={`${id}-group-${group.replace(/\W/g, '-')}`}
              key={group}
            >
              <div
                className="rich-select__group-label"
                id={`${id}-group-${group.replace(/\W/g, '-')}`}
              >
                {group}
              </div>
              {filtered
                .filter((option) => option.group === group)
                .map((option) => {
                  const index = filtered.indexOf(option)
                  const isSelected = option.id === value
                  const isActive = index === effectiveActiveIndex
                  return (
                    <button
                      type="button"
                      role="option"
                      id={`${id}-option-${option.id}`}
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      className={`rich-select__option ${isActive ? 'is-active' : ''}`}
                      disabled={option.disabled}
                      onPointerMove={() => setActiveIndex(index)}
                      onClick={() => {
                        if (option.disabled) return
                        if (typeaheadTimerRef.current)
                          window.clearTimeout(typeaheadTimerRef.current)
                        typeaheadRef.current = ''
                        onChange(option.id)
                        restoreFocusRef.current = true
                        setOpen(false)
                        setQuery('')
                      }}
                      key={option.id}
                    >
                      {renderOption(option, isSelected)}
                      {option.disabledReason ? (
                        <small className="rich-select__disabled-reason">
                          {option.disabledReason}
                        </small>
                      ) : null}
                    </button>
                  )
                })}
            </div>
          ))
        )}
      </div>
    </div>
  ) : null

  return (
    <div className={`rich-select ${prominent ? 'rich-select--prominent' : ''}`} ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        className="rich-select__trigger"
        role="combobox"
        aria-label={label}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open && activeOption ? `${id}-option-${activeOption.id}` : undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeys}
      >
        <span className="rich-select__selection">
          {selected ? renderSelected(selected) : label}
        </span>
        <ChevronDown aria-hidden="true" size={18} />
      </button>
      {portal && typeof document !== 'undefined'
        ? popover && createPortal(popover, document.body)
        : popover}
    </div>
  )
}
