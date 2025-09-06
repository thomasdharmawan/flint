"use client"

import React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  filters?: {
    key: string
    label: string
    options: { value: string; label: string }[]
    onFilter: (value: string) => void
    value?: string
  }[]
  actions?: React.ReactNode
  loading?: boolean
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  filters,
  actions,
  loading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showFilters, setShowFilters] = React.useState(false)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const clearSearch = () => {
    setSearchQuery("")
    onSearch?.("")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 flex-1">
          {onSearch && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-accent"
                  onClick={clearSearch}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          )}

          {filters && filters.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden hover:bg-accent transition-colors"
              >
                <Filter className="h-4 w-4 mr-1.5" />
                Filters
              </Button>

              <div className={`flex flex-wrap gap-2 ${showFilters ? "flex" : "hidden sm:flex"}`}>
                {filters.map((filter) => (
                  <Select key={filter.key} onValueChange={filter.onFilter} value={filter.value}>
                    <SelectTrigger className="w-[140px] sm:w-[180px] transition-colors hover:bg-accent">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {filter.label}</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
              </div>
            </div>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 self-start sm:self-auto">{actions}</div>}
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={`font-medium text-muted-foreground whitespace-nowrap ${column.className || ""}`}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-muted-foreground">No results found</div>
                      {searchQuery && (
                        <Button variant="outline" size="sm" onClick={clearSearch}>
                          Clear search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-muted/50 transition-colors duration-150 border-b last:border-b-0"
                  >
                    {columns.map((column) => (
                      <TableCell key={String(column.key)} className={`py-3 ${column.className || ""}`}>
                        {column.render ? column.render(item) : item[column.key as keyof T]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
