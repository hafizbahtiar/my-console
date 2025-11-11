"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CURRENCIES, getCurrencyName, getCurrencySymbol } from "@/lib/currencies";
import { useTranslation } from "@/lib/language-context";

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  showSymbol?: boolean;
}

export function CurrencySelect({
  value,
  onValueChange,
  label,
  required = false,
  disabled = false,
  placeholder,
  className,
  id = "currency",
  showSymbol = true,
}: CurrencySelectProps) {
  const { language } = useTranslation();
  const currentLanguage = language || 'en';

  const displayValue = (currencyCode: string) => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    if (!currency) return currencyCode;
    
    const name = currentLanguage === 'ms' ? currency.nameMs : currency.nameEn;
    return showSymbol ? `${currencyCode} - ${currency.symbol} ${name}` : `${currencyCode} - ${name}`;
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      {label && (
        <Label htmlFor={id} suppressHydrationWarning>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder || "Select currency"}>
            {value ? displayValue(value) : placeholder || "Select currency"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => {
            const name = currentLanguage === 'ms' ? currency.nameMs : currency.nameEn;
            const display = showSymbol 
              ? `${currency.code} - ${currency.symbol} ${name}`
              : `${currency.code} - ${name}`;
            
            return (
              <SelectItem key={currency.code} value={currency.code}>
                {display}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

