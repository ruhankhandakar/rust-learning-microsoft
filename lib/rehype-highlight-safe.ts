import { createLowlight, common } from "lowlight";
import type { Root, Element, ElementContent } from "hast";

const BROKEN_LANGS = new Set(["vbnet"]);
const safeCommon = Object.fromEntries(
  Object.entries(common).filter(([name]) => !BROKEN_LANGS.has(name))
);
const lowlight = createLowlight(safeCommon);

export default function rehypeHighlightSafe() {
  return (tree: Root) => {
    visit(tree);
  };
}

function visit(node: Root | Element) {
  if ("children" in node) {
    for (const child of node.children) {
      if (child.type === "element") {
        if (
          child.tagName === "pre" &&
          child.children.length === 1 &&
          child.children[0].type === "element" &&
          child.children[0].tagName === "code"
        ) {
          highlightCode(child.children[0]);
        } else {
          visit(child);
        }
      }
    }
  }
}

function highlightCode(node: Element) {
  const lang = getLanguage(node);
  const code = getText(node);
  if (!code) return;

  try {
    const result = lang
      ? lowlight.highlight(lang, code)
      : lowlight.highlightAuto(code);

    node.children = result.children as ElementContent[];

    const classes = Array.isArray(node.properties?.className)
      ? (node.properties.className as string[])
      : [];

    if (!classes.includes("hljs")) classes.push("hljs");
    if (result.data?.language && !classes.some((c) => c.startsWith("language-"))) {
      classes.push(`language-${result.data.language}`);
    }
    node.properties = { ...node.properties, className: classes };
  } catch {
    // Leave the code block unhighlighted on error
  }
}

function getLanguage(node: Element): string | undefined {
  const classes = Array.isArray(node.properties?.className)
    ? (node.properties.className as string[])
    : [];
  for (const cls of classes) {
    if (cls.startsWith("language-")) return cls.slice(9);
  }
  return undefined;
}

function getText(node: Element): string {
  let text = "";
  for (const child of node.children) {
    if (child.type === "text") text += child.value;
    else if (child.type === "element") text += getText(child);
  }
  return text;
}

