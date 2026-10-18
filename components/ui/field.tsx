'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        'flex w-full flex-col gap-7',
        className,
      )}
      {...props}
    />
  )
}

function Field({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation="vertical"
      className={cn('group/field flex w-full flex-col gap-3 data-[invalid=true]:text-destructive [&>*]:w-full [&>.sr-only]:w-auto', className)}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        'flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export {
  Field,
  FieldLabel,
  FieldGroup,
}