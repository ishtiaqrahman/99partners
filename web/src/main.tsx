/** Application shell keeps navigation, deep-linked evidence and local analyst tags together. */
import React, { useEffect, useState } from "react";
import {
  ChevronRight,
  PanelsTopLeft,
  Database,
  Code2,
  Workflow,
  Layers,
  Building2,
} from "lucide-react";
import { api, Meta, GroupScreen } from "./types";
import { number, readLocal, saveLocal, ErrorBox } from "./common";

import { createRoot } from "react-dom/client";
import { Accounts } from "./Accounts";
import { Assignment } from "./Assignment";
import { Chat } from "./Chat";
import { AccountDrawer } from "./AccountDrawer";
import { Groups } from "./Groups";
import { readGroupLocation } from "./group-location";
import { Method } from "./Method";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/instrument-serif/latin-400.css";
import "./style.css";
const CodeWalkthrough = React.lazy(() => import("./CodeWalkthrough"));
const navigation = [
  { id: "assignment", label: "Overview", icon: PanelsTopLeft },
  { id: "accounts", label: "Companies", icon: Building2 },
  { id: "groups", label: "Combinations", icon: Layers },
  { id: "method", label: "Methodology", icon: Workflow },
  { id: "code", label: "Code walkthrough", icon: Code2 },
] as const;
type View = (typeof navigation)[number]["id"];
function App() {
  const [meta, setMeta] = useState<Meta | null>(null),
    [error, setError] = useState("");
  const [view, setView] = useState<View>("assignment"),
    [selected, setSelected] = useState<string | null>(null);
  const [groupRoute, setGroupRoute] = useState("");
  const [groupScreen, setGroupScreen] = useState<GroupScreen | null>(null);
  const [about, setAbout] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [codeStep, setCodeStep] = useState("rows");
  const [tags, setTags] = useState<Record<string, string[]>>({});
  useEffect(() => {
    api<Meta>("summary")
      .then(setMeta)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(location.hash.slice(1));
      const route = params.get("view");
      const item = navigation.find(({ id }) => id === route);
      const showChat = params.get("chat") === "1" || route === "chat";
      // Older chat URLs still open the dock. Chat evidence links retain the current page.
      if (item) setView(item.id);
      else if (!showChat) setView("assignment");
      if (route === "groups" || (route === "method" && params.has("budget"))) {
        const copy = new URLSearchParams(params);
        copy.delete("account");
        copy.delete("chat");
        copy.delete("about");
        setGroupRoute(copy.toString());
      }
      if (route === "code") setCodeStep(params.get("step") || "rows");
      if (showChat) setChatOpen(true);
      setSelected(params.get("account"));
      setAbout(params.get("about"));
    };
    sync();
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    if (meta) setTags(readLocal("99-tags-" + meta.input_sha256, {}));
  }, [meta]);
  useEffect(() => {
    document.title =
      (navigation.find((n) => n.id === view)?.label || "Overview") +
      " · NinetyNine";
    window.scrollTo({ top: 0 });
  }, [view]);
  function pageLink(v: View, id: string | null = null) {
    return "#" + new URLSearchParams({
      ...((v === "groups" || v === "method")
        ? Object.fromEntries(new URLSearchParams(groupRoute))
        : {}),
      view: v,
      ...(v === "code" ? { step: codeStep } : {}),
      ...(id ? { account: id } : {}),
    }).toString();
  }
  function navigate(v: View, id: string | null = null) {
    location.hash = pageLink(v, id);
  }
  function updateTags(id: string, next: string[]) {
    const updated = { ...tags, [id]: next };
    setTags(updated);
    if (meta) saveLocal("99-tags-" + meta.input_sha256, updated);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#view=assignment"
          className="brand"
          aria-label="NinetyNine home"
        >
          <span className="brand-mark">99</span>
          <span>
            NinetyNine<small>TECHNOLOGY PARTNERS</small>
          </span>
        </a>
        <div className="workspace-label">INVESTMENT WORKSPACE</div>
        <label className="phone-navigation">
          <span>NinetyNine</span>
          <select aria-label="Workspace page" value={view}
            onChange={(event) => navigate(event.target.value as View)}>
            {navigation.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <a
              key={item.id}
              href={item.id === "groups" || item.id === "method" ? pageLink(item.id) : "#view=" + item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              aria-current={view === item.id ? "page" : undefined}
            >
              <item.icon size={18} />
              <strong>{item.label}</strong>
              {item.id === "accounts" && meta && (
                <span>{number(meta.total)}</span>
              )}
            </a>
          ))}
        </nav>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Research <ChevronRight size={13} />{" "}
            {navigation.find(({ id }) => id === view)?.label}
          </span>
          <span className="top-status">
            <Database size={15} aria-hidden="true" /> Company dataset · {meta ? number(meta.total) + " companies" : "Loading…"}
          </span>
        </header>
        <main>
          {error && <ErrorBox error={error} />}
          {!meta && !error && (
            <div className="loading" role="status">
              Loading companies…
            </div>
          )}
          {meta && (
            <>
              <div hidden={view !== "accounts"}>
                <Accounts
                  meta={meta}
                  tags={tags}
                  open={(id) => navigate(view, id)}
                />
              </div>
              {view === "groups" && (
                <Groups
                  route={groupRoute}
                  onScreen={setGroupScreen}
                  defaultMultiples={meta.multiples}
                  eligibleCount={meta.eligibility.Eligible || 0}
                  open={(id) => navigate(view, id)}
                />
              )}
              {view === "method" && (
                <Method
                  meta={meta}
                  scenario={readGroupLocation(new URLSearchParams(groupRoute)).settings}
                  combinationsHref={pageLink("groups")}
                />
              )}
              {view === "assignment" && <Assignment meta={meta} />}
              {view === "code" && (
                <React.Suspense
                  fallback={<p role="status">Loading the code walkthrough…</p>}
                >
                  <CodeWalkthrough requestedStep={codeStep} meta={meta} />
                </React.Suspense>
              )}
            </>
          )}
        </main>
        <footer>
          All financial figures in USD · Fictional company data · Check price
          estimates before making an offer
        </footer>
      </div>
      <Chat
        screen={{
          page: view,
          account: selected || about,
          step: view === "code" ? codeStep : undefined,
          group: view === "groups" ? groupScreen : undefined,
        }}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
      {selected && meta && (
        <AccountDrawer
          id={selected}
          ask={() => {
            const q = new URLSearchParams(view === "groups" ? groupRoute : "");
            q.set("view", view);
            if (view === "code") q.set("step", codeStep);
            q.set("chat", "1");
            q.set("about", selected);
            location.hash = q.toString();
          }}
          scenarioSettings={view === "groups" ? groupScreen?.applied : undefined}
          tags={tags[selected] || []}
          setTags={(next) => updateTags(selected, next)}
          close={() => navigate(view)}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
