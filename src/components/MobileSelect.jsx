import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Check } from 'lucide-react';

export default function MobileSelect({ value, onValueChange, placeholder, children, className, triggerClassName, required }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Parse children to extract SelectItem options
  const options = [];
  React.Children.forEach(children, (child) => {
    if (child && child.props) {
      options.push({ value: child.props.value, label: child.props.children });
    }
  });

  const selectedLabel = options.find(o => o.value === value)?.label;

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger className={triggerClassName || className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-12 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring ${triggerClassName || className || ''} ${!value ? 'text-muted-foreground' : ''}`}
      >
        {selectedLabel || placeholder}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">{placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onValueChange(opt.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-4 rounded-xl text-left transition-colors hover:bg-accent active:bg-accent/80"
              >
                <span className="text-base">{opt.label}</span>
                {value === opt.value && <Check className="h-5 w-5 text-primary" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}