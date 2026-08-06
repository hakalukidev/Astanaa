"use client";

import { Loader2, Zap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { requestListingBoost } from "@/lib/listing-service";
import type { BoostPaymentMethod } from "@/lib/listings";

const PAYMENT_METHODS: { value: BoostPaymentMethod; label: string }[] = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "card", label: "Debit/Credit Card" },
];

type BoostListingDialogProps = {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoosted: () => void;
};

export default function BoostListingDialog({
  listingId,
  open,
  onOpenChange,
  onBoosted,
}: BoostListingDialogProps) {
  const { toast } = useToast();
  const [method, setMethod] = useState<BoostPaymentMethod>("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      await requestListingBoost(listingId, method, transactionId.trim() || null);
      toast({
        title: "Boost request submitted",
        description: "We'll activate your boost once the payment is verified.",
      });
      onBoosted();
      onOpenChange(false);
      setTransactionId("");
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not submit your boost request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap size={18} className="text-amber-500" /> Boost this post
          </DialogTitle>
          <DialogDescription>
            Pay ৳100 to boost your ad and appear at the top of search results
            for 7 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Payment method</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMethod(option.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    method === option.value
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-300 text-gray-600 hover:border-green-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID (optional)</Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              placeholder="Send ৳100 and paste your transaction ID here"
            />
            <p className="text-xs text-gray-500">
              Online payment isn&apos;t wired up yet — send ৳100 via {" "}
              {PAYMENT_METHODS.find((option) => option.value === method)?.label} and
              we&apos;ll verify manually.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-600"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit boost request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
