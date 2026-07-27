import React from "react";
import { FileCode2 } from "lucide-react";

// Truly dependency-free CodeRunner.cs. It does NOT reference Microsoft.CodeAnalysis
// (Roslyn) and does NOT shell out to an external csc compiler — both approaches
// broke on real Unity installs and made the whole editor assembly fail to compile,
// which is why the Tools ▸ Lovelace Forge menu never appeared.
//
// Instead the bridge exposes a small set of built-in inspection/scene commands
// implemented directly against the UnityEngine / UnityEditor API. This file has
// ZERO project-level dependencies, so it always compiles on any Unity version and
// the Tools menu always shows up.
export const CODE_RUNNER_CS = `using System;
using System.Linq;
using System.Text;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEditor;
using UnityEditor.SceneManagement;
using Debug = UnityEngine.Debug;

namespace LovelaceForge.Bridge
{
    /// <summary>
    /// Runs bridge commands against the live editor. No external compiler, no
    /// Roslyn / Microsoft.CodeAnalysis reference — so this file always compiles
    /// and the Tools ▸ Lovelace Forge menu always appears.
    ///
    /// The bridge passes a command line as the "code" string. Supported commands:
    ///   ping
    ///   scene.info
    ///   scene.hierarchy
    ///   selection.info
    ///   assets.count
    ///   editor.info
    ///   log <message>
    /// Anything else returns a friendly "unknown command" listing the options.
    /// </summary>
    public static class CodeRunner
    {
        public static string Run(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return "ERROR: empty command.";

            code = code.Trim();
            string cmd = code;
            string arg = "";
            int sp = code.IndexOf(' ');
            if (sp > 0)
            {
                cmd = code.Substring(0, sp);
                arg = code.Substring(sp + 1).Trim();
            }

            try
            {
                switch (cmd.ToLowerInvariant())
                {
                    case "ping":       return "pong";
                    case "scene.info": return SceneInfo();
                    case "scene.hierarchy": return SceneHierarchy();
                    case "selection.info": return SelectionInfo();
                    case "assets.count": return AssetsCount();
                    case "editor.info": return EditorInfo();
                    case "log":
                        Debug.Log("[Lovelace Forge] " + arg);
                        return "Logged to the Unity Console: " + arg;
                    default:
                        return "Unknown command '" + cmd + "'. Available: ping, scene.info, " +
                               "scene.hierarchy, selection.info, assets.count, editor.info, log <message>.";
                }
            }
            catch (Exception e)
            {
                return "RUNTIME ERROR: " + e.Message;
            }
        }

        private static string SceneInfo()
        {
            var scene = SceneManager.GetActiveScene();
            var roots = scene.GetRootGameObjects();
            var sb = new StringBuilder();
            sb.AppendLine("Active scene: " + (string.IsNullOrEmpty(scene.name) ? "(untitled)" : scene.name));
            sb.AppendLine("Path: " + (string.IsNullOrEmpty(scene.path) ? "(unsaved)" : scene.path));
            sb.AppendLine("Root objects: " + roots.Length);
            sb.AppendLine("Total game objects: " + roots.Sum(r => r.GetComponentsInChildren<Transform>(true).Length));
            return sb.ToString().TrimEnd();
        }

        private static string SceneHierarchy()
        {
            var scene = SceneManager.GetActiveScene();
            var sb = new StringBuilder();
            sb.AppendLine(scene.name + ":");
            foreach (var root in scene.GetRootGameObjects())
                AppendTree(root.transform, sb, 1);
            return sb.ToString().TrimEnd();
        }

        private static void AppendTree(Transform t, StringBuilder sb, int depth)
        {
            sb.AppendLine(new string(' ', depth * 2) + "- " + t.name);
            for (int i = 0; i < t.childCount; i++)
                AppendTree(t.GetChild(i), sb, depth + 1);
        }

        private static string SelectionInfo()
        {
            var sel = Selection.gameObjects;
            if (sel == null || sel.Length == 0) return "Nothing is selected in the editor.";
            var sb = new StringBuilder();
            sb.AppendLine("Selected (" + sel.Length + "):");
            foreach (var go in sel)
            {
                var comps = go.GetComponents<Component>().Where(c => c != null).Select(c => c.GetType().Name);
                sb.AppendLine("- " + go.name + "  [" + string.Join(", ", comps) + "]");
            }
            return sb.ToString().TrimEnd();
        }

        private static string AssetsCount()
        {
            var all = AssetDatabase.GetAllAssetPaths().Where(p => p.StartsWith("Assets/")).ToArray();
            int scripts = all.Count(p => p.EndsWith(".cs"));
            int prefabs = all.Count(p => p.EndsWith(".prefab"));
            int scenes  = all.Count(p => p.EndsWith(".unity"));
            var sb = new StringBuilder();
            sb.AppendLine("Assets total: " + all.Length);
            sb.AppendLine("Scripts: " + scripts);
            sb.AppendLine("Prefabs: " + prefabs);
            sb.AppendLine("Scenes: " + scenes);
            return sb.ToString().TrimEnd();
        }

        private static string EditorInfo()
        {
            var sb = new StringBuilder();
            sb.AppendLine("Unity: " + Application.unityVersion);
            sb.AppendLine("Platform: " + Application.platform);
            sb.AppendLine("Product: " + Application.productName);
            sb.AppendLine("Playing: " + EditorApplication.isPlaying);
            return sb.ToString().TrimEnd();
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
        Console shows CodeAnalysis / MetadataReference errors?
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-stone-400">
        An older <span className="font-mono text-[11px] text-amber-300">CodeRunner.cs</span> referenced
        the Roslyn compiler (<span className="font-mono text-[11px] text-amber-300">Microsoft.CodeAnalysis</span>),
        which plain Unity projects can't resolve — so the whole editor assembly failed and the Tools
        menu never appeared. First <span className="text-stone-200">delete every old copy</span> of{" "}
        <span className="font-mono text-[11px] text-amber-300">CodeRunner.cs</span> and any duplicated{" "}
        <span className="font-mono text-[11px] text-amber-300">LovelaceForgeBridge</span> folder from your
        project, then re-download the bridge. This version has{" "}
        <span className="text-stone-200">zero dependencies</span> — it always compiles and the{" "}
        <span className="text-stone-200">Tools ▸ Lovelace Forge</span> menu appears.
      </p>
      <button
        onClick={handleDownload}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/70 hover:bg-emerald-500/15"
      >
        <FileCode2 className="h-4 w-4" /> Download fixed CodeRunner.cs (dependency-free)
      </button>
    </div>
  );
}