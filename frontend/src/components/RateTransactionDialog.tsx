import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Star, ThumbsDown, ThumbsUp } from "lucide-react";

type RatingValue = 1 | -1;

type TriggerButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "onClick" | "type"
>;

export default function RateTransactionDialog({
  triggerLabel,
  title = "Rate Transaction",
  description,
  subjectName,
  placeholder = "Write your review here (Required)...",
  requireComment = true,
  triggerProps,
  onSubmit,
}: {
  triggerLabel: string;
  title?: string;
  description?: string;
  subjectName?: string;
  placeholder?: string;
  requireComment?: boolean;
  triggerProps?: TriggerButtonProps;
  onSubmit: (args: { rating: RatingValue; comment: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = requireComment ? Boolean(comment.trim()) : true;

  const submit = async (rating: RatingValue) => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment: comment.trim() });
      setComment("");
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const computedDescription =
    description ??
    (subjectName
      ? `Please rate your experience with ${subjectName}.`
      : "Please rate your experience.");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" {...triggerProps}>
          <Star className="w-4 h-4 mr-2" /> {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{computedDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Textarea
            placeholder={placeholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex gap-2 justify-end">
            <Button
              variant="destructive"
              onClick={() => void submit(-1)}
              disabled={!canSubmit || isSubmitting}
            >
              <ThumbsDown className="w-4 h-4 mr-2" /> -1 Negative
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => void submit(1)}
              disabled={!canSubmit || isSubmitting}
            >
              <ThumbsUp className="w-4 h-4 mr-2" /> +1 Positive
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
