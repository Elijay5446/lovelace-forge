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
using System.IO;
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
    /// READ commands (safe off the main thread, run instantly regardless of focus):
    ///   ping · scene.info · scene.hierarchy · selection.info · assets.count · editor.info
    /// WRITE commands (mutate the scene/project — MUST run on the main thread; the
    /// bridge marshals these onto a force-ticked queue):
    ///   object.create · component.add · object.rename · object.delete
    ///   object.move · script.create · script.attach
    ///
    /// Commands arrive either as a bare word ("scene.hierarchy") or as a JSON
    /// envelope { "tool": "object.create", "args": { ... } } sent by Lovelace.
    /// </summary>
    public static class CodeRunner
    {
        // Write commands touch the scene/AssetDatabase and therefore require the
        // Unity main thread. The bridge checks this to decide how to dispatch.
        public static bool IsWriteCommand(string code)
        {
            var t = ToolName(code);
            switch (t)
            {
                case "object.create":
                case "component.add":
                case "object.rename":
                case "object.delete":
                case "object.move":
                case "script.create":
                case "script.attach":
                case "log":
                    return true;
                default:
                    return false;
            }
        }

        // Extracts the leading command/tool name from either a bare command line
        // or a JSON { "tool": ... } envelope, lowercased.
        private static string ToolName(string code)
        {
            if (string.IsNullOrWhiteSpace(code)) return "";
            code = code.Trim();
            if (code.StartsWith("{"))
            {
                try { return (JsonUtility.FromJson<Envelope>(code)?.tool ?? "").Trim().ToLowerInvariant(); }
                catch { return ""; }
            }
            int sp = code.IndexOf(' ');
            return (sp > 0 ? code.Substring(0, sp) : code).Trim().ToLowerInvariant();
        }

        [Serializable] private class Envelope { public string tool; public string args; }
        [Serializable] private class Args
        {
            public string type;      // primitive: cube, sphere, capsule, plane, cylinder, quad
            public string name;      // object / new name
            public string target;    // object to act on (by name)
            public string parent;    // optional parent name
            public string component; // component type to add
            public string script;    // script class name
            public string code;      // script source (for script.create)
            public float x, y, z;    // position / move
        }

        public static string Run(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return "ERROR: empty command.";

            code = code.Trim();

            // JSON envelope form: { "tool": "...", "args": "{...}" }
            if (code.StartsWith("{"))
            {
                Envelope env;
                try { env = JsonUtility.FromJson<Envelope>(code); }
                catch (Exception e) { return "RUNTIME ERROR: bad JSON envelope: " + e.Message; }
                var a = new Args();
                if (!string.IsNullOrWhiteSpace(env?.args))
                {
                    try { a = JsonUtility.FromJson<Args>(env.args) ?? new Args(); } catch { }
                }
                try { return Dispatch((env?.tool ?? "").Trim().ToLowerInvariant(), a); }
                catch (Exception e) { return "RUNTIME ERROR: " + e.Message; }
            }

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
                        return "Unknown command '" + cmd + "'. Available reads: scene.info, " +
                               "scene.hierarchy, selection.info, assets.count, editor.info. " +
                               "Writes are sent as JSON tools: object.create, component.add, " +
                               "object.rename, object.delete, object.move, script.create, script.attach.";
                }
            }
            catch (Exception e)
            {
                return "RUNTIME ERROR: " + e.Message;
            }
        }

        // Routes a JSON tool call to its implementation.
        private static string Dispatch(string tool, Args a)
        {
            switch (tool)
            {
                case "ping": return "pong";
                case "scene.info": return SceneInfo();
                case "scene.hierarchy": return SceneHierarchy();
                case "selection.info": return SelectionInfo();
                case "assets.count": return AssetsCount();
                case "editor.info": return EditorInfo();
                case "object.create": return ObjectCreate(a);
                case "component.add": return ComponentAdd(a);
                case "object.rename": return ObjectRename(a);
                case "object.delete": return ObjectDelete(a);
                case "object.move": return ObjectMove(a);
                case "script.create": return ScriptCreate(a);
                case "script.attach": return ScriptAttach(a);
                default: return "Unknown tool '" + tool + "'.";
            }
        }

        // ---- WRITE COMMANDS (main thread) ----

        private static GameObject Find(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return null;
            foreach (var root in SceneManager.GetActiveScene().GetRootGameObjects())
            {
                if (root.name == name) return root;
                foreach (var t in root.GetComponentsInChildren<Transform>(true))
                    if (t.name == name) return t.gameObject;
            }
            return null;
        }

        private static string ObjectCreate(Args a)
        {
            var kind = (a.type ?? "cube").Trim().ToLowerInvariant();
            PrimitiveType prim;
            switch (kind)
            {
                case "sphere": prim = PrimitiveType.Sphere; break;
                case "capsule": prim = PrimitiveType.Capsule; break;
                case "plane": prim = PrimitiveType.Plane; break;
                case "cylinder": prim = PrimitiveType.Cylinder; break;
                case "quad": prim = PrimitiveType.Quad; break;
                default: prim = PrimitiveType.Cube; break;
            }
            var go = GameObject.CreatePrimitive(prim);
            go.name = string.IsNullOrWhiteSpace(a.name) ? char.ToUpper(kind[0]) + kind.Substring(1) : a.name;
            go.transform.position = new Vector3(a.x, a.y, a.z);
            if (!string.IsNullOrWhiteSpace(a.parent))
            {
                var p = Find(a.parent);
                if (p != null) go.transform.SetParent(p.transform, true);
            }
            Undo.RegisterCreatedObjectUndo(go, "Create " + go.name);
            Selection.activeGameObject = go;
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Created " + kind + " '" + go.name + "' at (" + a.x + ", " + a.y + ", " + a.z + ").";
        }

        private static string ComponentAdd(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            var type = ResolveComponentType(a.component);
            if (type == null) return "RUNTIME ERROR: unknown component '" + a.component + "'.";
            if (go.GetComponent(type) != null) return "'" + a.target + "' already has a " + type.Name + ".";
            Undo.AddComponent(go, type);
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Added " + type.Name + " to '" + a.target + "'.";
        }

        // Resolves a friendly component name to a real UnityEngine type.
        private static Type ResolveComponentType(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return null;
            var n = name.Trim();
            var direct = typeof(Rigidbody).Assembly.GetType("UnityEngine." + n, false, true);
            if (direct != null && typeof(Component).IsAssignableFrom(direct)) return direct;
            // Common aliases / physics types live in the physics module too.
            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                var t = asm.GetType("UnityEngine." + n, false, true) ?? asm.GetType(n, false, true);
                if (t != null && typeof(Component).IsAssignableFrom(t)) return t;
            }
            return null;
        }

        private static string ObjectRename(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            Undo.RecordObject(go, "Rename");
            go.name = a.name;
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Renamed to '" + a.name + "'.";
        }

        private static string ObjectDelete(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            var scene = go.scene;
            Undo.DestroyObjectImmediate(go);
            EditorSceneManager.MarkSceneDirty(scene);
            return "Deleted '" + a.target + "'.";
        }

        private static string ObjectMove(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            Undo.RecordObject(go.transform, "Move");
            go.transform.position = new Vector3(a.x, a.y, a.z);
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Moved '" + a.target + "' to (" + a.x + ", " + a.y + ", " + a.z + ").";
        }

        // Writes a C# MonoBehaviour into Assets/LovelaceForge/ and triggers a
        // recompile. The class name must match the file name for Unity to attach it.
        private static string ScriptCreate(Args a)
        {
            if (string.IsNullOrWhiteSpace(a.script)) return "RUNTIME ERROR: script name required.";
            var cls = a.script.Trim();
            var dir = "Assets/LovelaceForge";
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            var path = dir + "/" + cls + ".cs";
            var src = string.IsNullOrWhiteSpace(a.code) ? DefaultScript(cls) : a.code;
            File.WriteAllText(path, src);
            AssetDatabase.ImportAsset(path);
            AssetDatabase.Refresh();
            return "Created script " + path + ". Unity is recompiling — attach it once the spinner finishes.";
        }

        private static string DefaultScript(string cls)
        {
            return "using UnityEngine;\\n\\npublic class " + cls + " : MonoBehaviour\\n{\\n" +
                   "    void Start() { }\\n\\n    void Update() { }\\n}\\n";
        }

        // Attaches an already-compiled MonoBehaviour (by class name) to an object.
        private static string ScriptAttach(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            var type = ResolveMonoBehaviour(a.script);
            if (type == null)
                return "The script '" + a.script + "' isn't compiled yet. Wait for Unity to finish compiling, then try attaching again.";
            if (go.GetComponent(type) != null) return "'" + a.target + "' already has " + type.Name + ".";
            Undo.AddComponent(go, type);
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Attached " + type.Name + " to '" + a.target + "'.";
        }

        private static Type ResolveMonoBehaviour(string cls)
        {
            if (string.IsNullOrWhiteSpace(cls)) return null;
            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                var t = asm.GetType(cls, false, true);
                if (t != null && typeof(MonoBehaviour).IsAssignableFrom(t)) return t;
            }
            return null;
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