import fs from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});

/** Source inventory: no app initialization, credentials, network or database writes. */
export function auditUiContracts(root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")) {
  const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
  const routing = { exports: {} };
  runInNewContext(ts.transpileModule(read("src/lib/route-permissions.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText, { module: routing, exports: routing.exports }, { timeout: 1000 });
  const { matchRoutePermission, checkRule } = routing.exports;
  const pages = walk(path.join(root, "src/app")).filter((file) => file.endsWith("/page.tsx")).map((file) => ({
    file: path.relative(root, file),
    route: "/" + path.relative(path.join(root, "src/app"), path.dirname(file)).split(path.sep).filter((part) => !part.startsWith("(") && part !== ".").join("/"),
  }));
  const destination = (node) => ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text :
    ts.isTemplateExpression(node) ? node.head.text + node.templateSpans.map((span) => "[id]" + span.literal.text).join("") : null;
  const matches = (pattern, target) => {
    const a = pattern.split("/"), b = target.split("/");
    return a.length === b.length && a.every((part, index) => part === b[index] || /^\[.+\]$/.test(part) || /^\[.+\]$/.test(b[index]));
  };
  const links = [], controls = [], navigation = [], issues = [], dynamicLinks = [];
  let dynamicDestinations = 0;
  for (const file of walk(path.join(root, "src")).filter((file) => file.endsWith(".tsx"))) {
    const name = path.relative(root, file);
    const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const location = (node) => `${name}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    const addLink = (node, expression) => {
      if (!expression) return;
      const href = destination(expression);
      if (href !== null) links.push({ location: location(node), href });
      else { dynamicDestinations++; dynamicLinks.push({ location: location(node), expression: expression.getText() }); }
    };
    const visit = (node) => {
      if (ts.isJsxAttribute(node) && node.name.getText() === "href" && node.initializer) {
        addLink(node, ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer);
      }
      if (ts.isPropertyAssignment(node) && node.name.getText() === "href") addLink(node, node.initializer);
      if (ts.isCallExpression(node) && /^(router\.(push|replace)|redirect)$/.test(node.expression.getText())) addLink(node, node.arguments[0]);
      if (ts.isObjectLiteralExpression(node) && /src\/components\/layouts\/(sidebar|header)\.tsx$/.test(name)) {
        const property = (key) => node.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === key)?.initializer;
        const href = property("href"), children = property("children");
        if (href && !children && destination(href)?.startsWith("/")) {
          const permission = property("permission"), anyOf = property("anyOf"), allOf = property("allOf");
          const list = (value) => value && ts.isArrayLiteralExpression(value) ? value.elements.map(destination).filter(Boolean) : [];
          const rule = { permission: permission ? destination(permission) : undefined, anyOf: list(anyOf), allOf: list(allOf) };
          const target = destination(href);
          navigation.push({ location: location(node), href: target, ...rule });
          const route = matchRoutePermission(target);
          const names = new Set([rule.permission, route?.permission, ...rule.anyOf, ...rule.allOf, ...(route?.anyOf ?? []), ...(route?.allOf ?? [])].filter(Boolean));
          const candidates = [...names];
          const scenarios = Array.from({ length: 2 ** candidates.length }, (_, bits) =>
            new Set(candidates.filter((_, index) => bits & (2 ** index))));
          for (const grants of scenarios) {
            const can = (name) => grants.has(name);
            if (checkRule(rule, can) !== checkRule(route, can)) {
              issues.push(`${location(node)}: navigation and route gates differ for ${target}`); break;
            }
          }
        }
      }
      const control = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
      if (control && /^(Button|button|DropdownMenuItem|AlertDialogAction|TabsTrigger)$/.test(control.tagName.getText())) {
        const conditions = [];
        for (let parent = node.parent; parent && !ts.isFunctionLike(parent); parent = parent.parent) {
          if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) conditions.push(parent.left.getText());
        }
        const text = node.getText();
        const archive = /setArchive(?:Target|Dialog|Action)\(/.test(text) && /(?:kind:\s*)?"archive"/.test(text);
        if (archive && !conditions.some((condition) => /\bcanUpdate\w*\b/.test(condition))) issues.push(`${location(node)}: archive control lacks an update gate`);
        controls.push({ location: location(node), kind: control.tagName.getText(), archive, conditions });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  for (const link of links) {
    const target = link.href.split(/[?#]/)[0];
    if (!target.startsWith("/") || target.startsWith("//") || target.startsWith("/api/") || fs.existsSync(path.join(root, "public", target))) continue;
    if (!pages.some((page) => matches(page.route, target))) issues.push(`${link.location}: missing page for ${link.href}`);
  }
  for (const page of pages.filter((page) => page.file.includes("(dashboard)"))) {
    if (!matchRoutePermission(page.route)) issues.push(`${page.file}: missing page permission rule`);
  }
  return { counts: { pages: pages.length, dashboardPages: pages.filter((page) => page.file.includes("(dashboard)")).length, links: links.length, controls: controls.length, navigation: navigation.length, dynamicDestinations }, issues, pages, navigation, links, dynamicLinks, controls };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditUiContracts();
  process.stdout.write(JSON.stringify(process.argv.includes("--inventory") ? result : { counts: result.counts, issues: result.issues }, null, 2) + "\n");
  if (result.issues.length) process.exitCode = 1;
}
