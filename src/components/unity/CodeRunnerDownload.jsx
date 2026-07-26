import React from "react";
import { FileCode2 } from "lucide-react";

// The current, Unity-6-compatible CodeRunner.cs (Roslyn-based, no System.CodeDom).
// Served in-browser as a Blob so the download is always the fixed version — no
// external hosting to keep in sync.
const CODE_RUNNER_CS = `using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Emit;
using UnityEngine;
using UnityEditor;

namespace LovelaceForge.Bridge
{
    /// <summary>
    /// Compiles and runs a C# snippet in-process (no domain reload) on the main thread.
    /// The snippet is the body of \`static string Execute()\` — write statements, and
    /// \`return "your result";\` to send data back to Lovelace. It can use the full
    /// UnityEngine / UnityEditor API.
    ///
    /// Uses the Roslyn compiler (Microsoft.CodeAnalysis) that ships with Unity 6 /
    /// the .NET Standard 2.1 profile — the legacy System.CodeDom compiler is not
    /// available on modern Unity, so we avoid it entirely.
    /// </summary>
    public static class CodeRunner
    {
        // Cache references — resolving loaded assemblies is the slow part.
        private static List<MetadataReference> _references;

        public static string Run(string code)
        {
            string source = $@"using UnityEngine;
using UnityEditor;
using System;
using System.IO;
using System.Linq;
using System.Collections;
using System.Collections.Generic;

namespace LovelaceForge.Runtime
{{
    public static class RunCommand
    {{
        public static string Execute()
        {{
{code}
            return ""ok"";
        }}
    }}
}}";

            SyntaxTree tree;
            try
            {
                tree = CSharpSyntaxTree.ParseText(source);
            }
            catch (Exception e)
            {
                return "COMPILE ERROR: could not parse snippet — " + e.Message;
            }

            var options = new CSharpCompilationOptions(
                OutputKind.DynamicallyLinkedLibrary,
                optimizationLevel: OptimizationLevel.Release,
                allowUnsafe: false);

            var compilation = CSharpCompilation.Create(
                "LovelaceForge_Snippet_" + Guid.NewGuid().ToString("N"),
                new[] { tree },
                GetReferences(),
                options);

            using (var ms = new MemoryStream())
            {
                EmitResult result;
                try
                {
                    result = compilation.Emit(ms);
                }
                catch (Exception e)
                {
                    return "COMPILE ERROR: emit failed — " + e.Message;
                }

                if (!result.Success)
                {
                    var sb = new StringBuilder();
                    foreach (var d in result.Diagnostics)
                    {
                        if (d.Severity != DiagnosticSeverity.Error) continue;
                        var line = d.Location.GetLineSpan().StartLinePosition.Line + 1;
                        sb.AppendLine(d.GetMessage() + " (line " + line + ")");
                    }
                    return "COMPILE ERROR:\\n" + sb;
                }

                ms.Seek(0, SeekOrigin.Begin);
                Assembly assembly;
                try
                {
                    assembly = Assembly.Load(ms.ToArray());
                }
                catch (Exception e)
                {
                    return "COMPILE ERROR: could not load compiled assembly — " + e.Message;
                }

                var type = assembly.GetType("LovelaceForge.Runtime.RunCommand");
                var method = type?.GetMethod("Execute", BindingFlags.Public | BindingFlags.Static);
                if (method == null)
                    return "COMPILE ERROR: RunCommand.Execute not found.";

                try
                {
                    return (string)method.Invoke(null, null);
                }
                catch (Exception e)
                {
                    return "RUNTIME ERROR: " + (e.InnerException ?? e);
                }
            }
        }

        /// <summary>
        /// Build metadata references from every assembly currently loaded in the
        /// editor AppDomain that has a real file on disk. This makes the full
        /// UnityEngine / UnityEditor / System API surface available to the snippet.
        /// </summary>
        private static List<MetadataReference> GetReferences()
        {
            if (_references != null) return _references;

            var refs = new List<MetadataReference>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                if (asm.IsDynamic) continue;
                string location;
                try { location = asm.Location; }
                catch { continue; }
                if (string.IsNullOrEmpty(location) || !File.Exists(location)) continue;
                if (!seen.Add(location)) continue;
                try { refs.Add(MetadataReference.CreateFromFile(location)); }
                catch { /* skip anything Roslyn can't read */ }
            }

            _references = refs;
            return refs;
        }
    }
}
`;

export default function CodeRunnerDownload() {
  const handleDownload = () => {
    const blob = new Blob([CODE_RUNNER_CS], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CodeRunner.cs";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] p-4">
      <p className="text-sm font-semibold text-stone-100">
        Unity 6 didn't compile / no Tools menu?
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-stone-400">
        The zip's <span className="font-mono text-[11px] text-amber-300">CodeRunner.cs</span> uses
        an old compiler that Unity 6 removed. Download the fixed file below and drop it into{" "}
        <span className="text-stone-200">Assets/Editor/</span>, replacing the old one. Unity
        recompiles and the <span className="text-stone-200">Tools ▸ Lovelace Forge</span> menu
        appears.
      </p>
      <button
        onClick={handleDownload}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/70 hover:bg-emerald-500/15"
      >
        <FileCode2 className="h-4 w-4" /> Download fixed CodeRunner.cs (Unity 6)
      </button>
    </div>
  );
}