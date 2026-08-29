"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, AudioLines, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/tooltip";
import { MediaUploadField } from "@/components/sermons/media-upload-field";
import type { Sermon, CreateSermonInput } from "@/hooks/use-sermons";

const sermonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  speaker: z.string().optional(),
  sermonDate: z.string().min(1, "Date is required"),
  scriptureReference: z.string().optional(),
  seriesName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  durationMinutes: z.string().optional(),
  durationSeconds: z.string().optional(),
  description: z.string().optional(),
});

type SermonFormValues = z.infer<typeof sermonSchema>;

interface SermonFormProps {
  sermon?: Sermon;
  onSubmit: (input: CreateSermonInput) => Promise<void>;
  submitLabel: string;
}

export function SermonForm({ sermon, onSubmit, submitLabel }: SermonFormProps) {
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(sermon?.tags ?? []);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(sermon?.audioUrl);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(sermon?.videoUrl);

  const form = useForm<SermonFormValues>({
    resolver: zodResolver(sermonSchema),
    defaultValues: {
      title: "",
      speaker: "",
      sermonDate: "",
      scriptureReference: "",
      seriesName: "",
      tags: [],
      durationMinutes: "",
      durationSeconds: "",
      description: "",
    },
  });

  useEffect(() => {
    if (sermon) {
      const dur = sermon.durationSeconds ?? 0;
      const mins = Math.floor(dur / 60);
      const secs = dur % 60;
      form.reset({
        title: sermon.title,
        speaker: sermon.speaker ?? "",
        sermonDate: sermon.sermonDate.slice(0, 10),
        scriptureReference: sermon.scriptureReference ?? "",
        seriesName: sermon.seriesName ?? "",
        tags: sermon.tags,
        durationMinutes: mins > 0 ? String(mins) : "",
        durationSeconds: secs > 0 ? String(secs) : "",
        description: sermon.description ?? "",
      });
      setTags(sermon.tags);
      setAudioUrl(sermon.audioUrl);
      setVideoUrl(sermon.videoUrl);
    }
  }, [sermon, form]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      const next = [...tags, t];
      setTags(next);
      form.setValue("tags", next);
    }
    setTagInput("");
  };

  const removeTag = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    form.setValue("tags", next);
  };

  const handleSubmit = async (values: SermonFormValues) => {
    setSaving(true);
    try {
      const mins = parseInt(values.durationMinutes || "0", 10) || 0;
      const secs = parseInt(values.durationSeconds || "0", 10) || 0;
      const durationSeconds = mins * 60 + secs || undefined;

      const input: CreateSermonInput = {
        title: values.title,
        sermonDate: values.sermonDate,
        speaker: values.speaker || undefined,
        scriptureReference: values.scriptureReference || undefined,
        seriesName: values.seriesName || undefined,
        tags: tags.length > 0 ? tags : undefined,
        audioUrl: audioUrl || undefined,
        videoUrl: videoUrl || undefined,
        durationSeconds,
        description: values.description || undefined,
      };
      await onSubmit(input);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sermon Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Walking in Faith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="speaker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Speaker</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Pastor John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sermonDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="scriptureReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scripture Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Hebrews 11:1-6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Series & Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="seriesName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Series</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Faith Foundations" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Tags</FormLabel>
              <div className="mt-1.5 flex gap-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {t}
                      <ActionTooltip label={`Remove ${t}`}>
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="rounded-full p-0.5 hover:bg-primary/20"
                          aria-label={`Remove ${t}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </ActionTooltip>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <AudioLines className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Audio Recording</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an audio file or paste a SoundCloud/podcast link.
                </p>
                <MediaUploadField
                  label="Audio"
                  accept="audio/*"
                  mediaType="audio"
                  value={audioUrl}
                  onChange={setAudioUrl}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Video</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a video file or paste a YouTube/Vimeo link.
                </p>
                <MediaUploadField
                  label="Video"
                  accept="video/*"
                  mediaType="video"
                  value={videoUrl}
                  onChange={setVideoUrl}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duration & Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="59" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Sermon summary or notes..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
