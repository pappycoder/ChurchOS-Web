import type { HelpSummary, HelpTopic } from "./catalog";
export interface HelpSearchEntry extends HelpSummary {
  searchText: string;
}
const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "for",
  "how",
  "i",
  "in",
  "is",
  "my",
  "of",
  "on",
  "the",
  "to",
  "we",
  "with",
  "your",
]);
const normalise = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ");
/** A small local index. Every meaningful search term must match; titles rank first. */
export function searchHelpArticles(
  index: readonly HelpSearchEntry[],
  query: string,
  topic?: HelpTopic | "all",
) {
  const words = [
    ...new Set(
      normalise(query.slice(0, 160))
        .split(" ")
        .filter((word) => word && !stopWords.has(word)),
    ),
  ];
  return index
    .filter((article) => !topic || topic === "all" || article.topic === topic)
    .map((article) => {
      const title = normalise(article.title);
      const keywords = normalise(article.keywords.join(" "));
      const description = normalise(article.summary);
      const body = normalise(article.searchText);
      const matches = words.every((word) =>
        [title, keywords, description, body].some((text) =>
          text.includes(word),
        ),
      );
      const score = words.reduce(
        (sum, word) =>
          sum +
          (title.includes(word)
            ? 10
            : keywords.includes(word)
              ? 6
              : description.includes(word)
                ? 3
                : 1),
        0,
      );
      return { article, matches, score };
    })
    .filter((result) => result.matches)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(!!b.article.popular) - Number(!!a.article.popular) ||
        a.article.title.localeCompare(b.article.title),
    )
    .map((result) => result.article);
}
