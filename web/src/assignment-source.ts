/** Read the assignment files at build time. The guide and the runnable submission
 * share the same code, including its original file names and line numbers. */
import cleaning from "../../src/workbench/cleaning.py?raw";
import analysis from "../../src/workbench/analysis.py?raw";
import pipeline from "../../src/workbench/pipeline.py?raw";
import groups from "../../src/workbench/groups.sql?raw";
import optimizer from "../../src/workbench/groups.py?raw";
import policy from "../../src/workbench/policy.py?raw";
import checks from "../../tests/test_analysis.py?raw";

const sources = {
  "cleaning.py": cleaning,
  "analysis.py": analysis,
  "pipeline.py": pipeline,
  "groups.sql": groups,
  "groups.py": optimizer,
  "policy.py": policy,
  "test_analysis.py": checks,
};

/** Select by recognizable code, so adding a comment above an excerpt does not
 * move it to the wrong lines. The path and starting line let readers find it. */
export function excerpt(
  file: keyof typeof sources,
  start: string,
  end = start,
) {
  const lines = sources[file].trimEnd().split("\n");
  const first = lines.findIndex((line) => line.trimStart().startsWith(start));
  const last = lines.findIndex(
    (line, i) => i >= first && line.trimStart().startsWith(end),
  );
  const path =
    (file === "test_analysis.py" ? "tests/" : "src/workbench/") + file;
  // An interview edit may replace a whole expression. Keep the new source
  // available without showing old code or preventing other steps from opening.
  if (first < 0 || last < first)
    return { path, first: 0, last: 0, code: sources[file].trimEnd() };
  const selection = lines.slice(first, last + 1);
  const indent = Math.min(
    ...selection
      .filter((line) => line.trim())
      .map((line) => line.length - line.trimStart().length),
  );
  return {
    path,
    first: first + 1,
    last: last + 1,
    code: selection.map((line) => line.slice(indent)).join("\n"),
  };
}
