import React, { useEffect, useState } from "react";
import Imports from "./pages/Imports.jsx";
import ImportDetail from "./pages/ImportDetail.jsx";

// Why this exists:
// Avoid router libs for a 1-day task; keep navigation minimal and readable.
export default function App() {
  const [view, setView] = useState({ name: "imports", id: null });

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash.startsWith("import/")) {
      const id = Number(hash.split("/")[1]);
      setView({ name: "import", id });
    } else {
      setView({ name: "imports", id: null });
    }
  }, []);

  if (view.name === "import") {
    return <ImportDetail id={view.id} />;
  }
  return <Imports />;
}
