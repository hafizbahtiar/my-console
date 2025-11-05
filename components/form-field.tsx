"use client"

import { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface BaseFieldProps {
  label: string
  error?: string
  required?: boolean
  description?: string
  className?: string
}

interface InputFieldProps extends BaseFieldProps {
  type: 'input'
  inputType?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  rows?: number
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

interface CheckboxFieldProps extends BaseFieldProps {
  type: 'checkbox'
  checked: boolean
  onChange: (checked: boolean) => void
}

type FormFieldProps =
  | InputFieldProps
  | TextareaFieldProps
  | SelectFieldProps
  | CheckboxFieldProps

export function FormField(props: FormFieldProps) {
  const { label, error, required, description, className } = props

  const renderField = () => {
    switch (props.type) {
      case 'input':
        return (
          <Input
            type={props.inputType || 'text'}
            placeholder={props.placeholder}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            className={cn(error && 'border-destructive', className)}
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={props.placeholder}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            rows={props.rows || 3}
            className={cn(error && 'border-destructive', className)}
          />
        )

      case 'select':
        return (
          <Select value={props.value} onValueChange={props.onChange}>
            <SelectTrigger className={cn(error && 'border-destructive', className)}>
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={props.checked}
              onCheckedChange={props.onChange}
              className={cn(error && 'border-destructive', className)}
            />
            <Label className="text-sm font-normal">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  // For checkbox, the label is rendered within the field
  if (props.type === 'checkbox') {
    return (
      <div className="space-y-2">
        {renderField()}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
