'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Coins } from "lucide-react";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName: string;
  itemPrice: number;
  currentBalance: number;
}

export function PurchaseDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  itemPrice,
  currentBalance
}: PurchaseDialogProps) {
  const newBalance = currentBalance - itemPrice;
  const isFree = itemPrice === 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isFree ? 'Claim Free Gift' : 'Confirm Purchase'}</AlertDialogTitle>
          <AlertDialogDescription>
            {isFree 
              ? `Claim your ${itemName}? This can only be claimed once!`
              : `Are you sure you want to purchase ${itemName}?`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {!isFree && (
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Item Cost:</span>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-semibold">{itemPrice.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Balance:</span>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-semibold">{currentBalance.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="h-px bg-border my-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">New Balance:</span>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">{newBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isFree ? 'Claim Now' : 'Confirm Purchase'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
