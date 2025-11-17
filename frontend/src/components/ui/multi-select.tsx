"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, X, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const multiSelectVariants = cva(
  "m-1",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600/40 text-blue-50",
        secondary:
          "border-foreground/10 bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        inverted: "inverted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  onValueChange: (value: string[]) => void;
  defaultValue: string[];
  placeholder?: string;
  animation?: number;
  maxCount?: number;
  asChild?: boolean;
  className?: string;
}

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      animation = 0,
      maxCount = 3,
      asChild = false,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedValues, setSelectedValues] =
      React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    React.useEffect(() => {
      setSelectedValues(defaultValue);
    }, [defaultValue]);

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = (value: string) => {
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            {...props}
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            className={cn(
              "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-zinc-800 focus-visible:ring-0 focus-visible:ring-offset-0",
              className
            )}
          >
            {selectedValues.length > 0 ? (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-wrap items-center">
                  {selectedValues.slice(0, maxCount).map((value) => {
                    const option = options.find((o) => o.value === value);
                    const Icon = option?.icon;
                    return (
                      <Badge
                        key={value}
                        className={cn(multiSelectVariants({ variant }))}
                      >
                        {Icon && <Icon className="h-4 w-4 mr-2" />}
                        {option?.label}
                        <X
                          className="ml-2 h-4 w-4 cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleOption(value);
                          }}
                        />
                      </Badge>
                    );
                  })}
                  {selectedValues.length > maxCount && (
                    <Badge
                      className={cn(
                        "bg-transparent text-foreground border-foreground/10",
                        multiSelectVariants({ variant })
                      )}
                    >
                      +{selectedValues.length - maxCount} more
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <X
                    className="h-4 w-4 cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedValues([]);
                      onValueChange([]);
                    }}
                  />
                  <span className="mx-2">|</span>
                  <ChevronsUpDown className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full mx-auto">
                <span className="text-sm text-muted-foreground">{placeholder}</span>
                <ChevronsUpDown className="h-4 w-4" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-800 border-zinc-700">
          <Command className="bg-transparent [&_[cmdk-item][aria-selected]]:bg-zinc-700">
            <CommandInput
              placeholder="Search..."
              onKeyDown={handleInputKeyDown}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggleOption(option.value)}
                    style={{
                      pointerEvents: "auto",
                      opacity: 1,
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center w-full">
                      <div className="flex items-center gap-2">
                        {selectedValues.includes(option.value) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                        {option.icon && (
                          <option.icon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{option.label}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
