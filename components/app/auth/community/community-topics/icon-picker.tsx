"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquare, X } from "lucide-react";
import { AVAILABLE_ICONS } from "./types";
import { getIconComponent } from "./utils";
import { cn } from "@/lib/utils";

interface IconPickerProps {
    value: string;
    onChange: (iconName: string) => void;
    onClear?: () => void;
}

export function IconPicker({ value, onChange, onClear }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter icons based on search query
    const filteredIcons = AVAILABLE_ICONS.filter(icon =>
        icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        icon.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (iconName: string) => {
        onChange(iconName);
        setOpen(false);
        setSearchQuery('');
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setSearchQuery('');
        }
    };

    const IconComponent = value ? getIconComponent(value) : MessageSquare;

    return (
        <div className="flex items-center gap-2 w-full">
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 justify-start"
                    >
                        {value ? (
                            <>
                                {React.createElement(IconComponent, { className: "h-4 w-4 mr-2 shrink-0" })}
                                <span className="capitalize truncate">{value.replace(/-/g, ' ')}</span>
                            </>
                        ) : (
                            <>
                                <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                                <span className="text-muted-foreground">Select an icon</span>
                            </>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[380px] p-0 overflow-visible"
                    align="start"
                    sideOffset={4}
                    style={{ zIndex: 9999 }}
                >
                    <div className="flex flex-col max-h-[320px]">
                        <div className="flex h-9 items-center gap-2 border-b px-3 flex-shrink-0">
                            <MessageSquare className="size-4 shrink-0 opacity-50" />
                            <input
                                type="text"
                                placeholder="Search icons..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                onWheel={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div
                            className="flex-1 overflow-y-auto overflow-x-hidden max-h-[240px]"
                            onWheel={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {filteredIcons.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No icons found. Try a different search term.
                                </div>
                            ) : (
                                <div className="grid grid-cols-6 gap-2 p-3">
                                    {filteredIcons.map((icon) => {
                                        const IconComponent = icon.component;
                                        const isSelected = value === icon.name;
                                        return (
                                            <button
                                                key={icon.name}
                                                type="button"
                                                onClick={() => handleSelect(icon.name)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-md border transition-all",
                                                    "hover:bg-accent hover:border-primary hover:shadow-sm",
                                                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                                                    isSelected && "bg-accent border-primary shadow-sm"
                                                )}
                                                title={icon.label}
                                                aria-label={icon.label}
                                                aria-pressed={isSelected}
                                            >
                                                <IconComponent className={cn(
                                                    "h-5 w-5 shrink-0",
                                                    isSelected && "text-primary"
                                                )} />
                                                <span className="text-[10px] leading-tight text-center truncate w-full px-0.5">
                                                    {icon.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            {value && onClear && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-10 px-3 text-xs shrink-0"
                    aria-label="Clear selected icon"
                >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Clear
                </Button>
            )}
        </div>
    );
}

