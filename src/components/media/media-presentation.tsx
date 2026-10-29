"use client";
import {
  PeopleHeader,
  PeopleMoreFilters,
  peopleWorkspaceClass,
} from "@/components/members/people-presentation";
import { cn } from "@/lib/utils";
import styles from "./media-presentation.module.css";
export const MediaHeader = PeopleHeader;
export const MediaMoreFilters = PeopleMoreFilters;
export const mediaWorkspaceClass = cn(peopleWorkspaceClass, styles.workspace);
export const mediaKindTones = {
  image: "bg-blue-500/8 text-blue-700 dark:text-blue-300",
  audio: "bg-violet-500/8 text-violet-700 dark:text-violet-300",
  video: "bg-rose-500/8 text-rose-700 dark:text-rose-300",
  document: "bg-amber-500/8 text-amber-800 dark:text-amber-300",
};
