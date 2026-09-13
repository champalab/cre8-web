import * as React from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

export type MultiSelectOption<T extends string | number = string | number> = {
  value: T
  label: string
  description?: string
  disabled?: boolean
}

type MultiSelectComboboxProps<T extends string | number = string | number> = {
  options: MultiSelectOption<T>[]
  selected: T[]
  onChange: (selected: T[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

function MultiSelectCombobox<T extends string | number = string | number>({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No items found',
  disabled = false,
  className,
}: MultiSelectComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedOptions = React.useMemo(
    () => options.filter((option) => selected.includes(option.value)),
    [options, selected]
  )

  const filteredOptions = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return options

    return options.filter((option) => {
      const haystack = `${option.label} ${option.description ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [options, search])

  const toggleValue = (value: T, optionDisabled?: boolean) => {
    if (optionDisabled) return

    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    )
  }

  const removeValue = (value: T, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onChange(selected.filter((item) => item !== value))
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-auto min-h-10 w-full justify-between px-3 py-2 font-normal',
            !selected.length && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1 text-left">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge key={String(option.value)} variant="secondary" className="gap-1 pr-1">
                  {option.label}
                  <button
                    type="button"
                    className="rounded-sm opacity-70 hover:opacity-100"
                    onClick={(event) => removeValue(option.value, event)}
                    aria-label={`Remove ${option.label}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 size-4 shrink-0 opacity-50" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ScrollArea className="max-h-60">
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => toggleValue(option.value, option.disabled)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50',
                      isSelected && 'bg-accent/50'
                    )}
                  >
                    <Check
                      className={cn('mt-0.5 size-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{option.label}</span>
                      {option.description ? (
                        <span className="block text-xs text-muted-foreground">{option.description}</span>
                      ) : null}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export { MultiSelectCombobox }
