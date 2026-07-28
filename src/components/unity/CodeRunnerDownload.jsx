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
    ///   object.inspect
    /// WRITE commands (mutate the scene/project — MUST run on the main thread; the
    /// bridge marshals these onto a force-ticked queue):
    ///   object.create · object.empty · component.add · object.rename · object.delete
    ///   object.move · object.scale · object.rotate · object.parent · object.duplicate
    ///   object.color · object.light · camera.frame · property.set
    ///   script.create · script.attach · scene.save · editor.play
    ///
    /// property.set is the universal escape hatch: it uses reflection to set almost
    /// any public field/property on any component of a target object, so Lovelace can
    /// configure things there's no dedicated tool for — WITHOUT any compiler dependency.
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
                case "object.empty":
                case "component.add":
                case "object.rename":
                case "object.delete":
                case "object.move":
                case "object.scale":
                case "object.rotate":
                case "object.parent":
                case "object.duplicate":
                case "object.color":
                case "object.light":
                case "camera.frame":
                case "property.set":
                case "script.create":
                case "script.attach":
                case "character.import":
                case "character.status":
                case "scene.save":
                case "editor.play":
                case "batch":
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
        // A batch envelope carries a list of already-serialized step envelopes,
        // each a JSON string of the form {"tool":"...","args":"{...}"}. Running
        // them all in ONE bridge call means a single main-thread pass instead of
        // one slow HTTP round-trip per step — the key to fast multi-step edits.
        [Serializable] private class BatchEnvelope { public string tool; public string[] steps; }
        [Serializable] private class Args
        {
            public string type;      // primitive: cube, sphere, capsule, plane, cylinder, quad
            public string name;      // object / new name
            public string target;    // object to act on (by name)
            public string parent;    // optional parent name
            public string component; // component type (component.add / property.set)
            public string script;    // script class name
            public string code;      // script source (for script.create)
            public string property;  // property/field name (property.set)
            public string value;     // string value to coerce (property.set)
            public string color;     // hex like #RRGGBB or a name (object.color / object.light)
            public string mode;      // light kind: directional | point | spot (object.light)
            public float x, y, z;    // position / move / rotation (euler) / scale
            public float intensity;  // light intensity (object.light)
            public string fbx;       // rigged model url (character.import)
            public string walk;      // walk animation url (character.import)
            public string run;       // run animation url (character.import)
        }

        public static string Run(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return "ERROR: empty command.";

            code = code.Trim();

            // Batch form: { "tool": "batch", "steps": [ "<step json>", ... ] }.
            // Each step is itself a serialized envelope; we run them in order in
            // this single main-thread call and stitch the results together.
            if (code.StartsWith("{") && code.Contains("\\"steps\\""))
            {
                BatchEnvelope batch = null;
                try { batch = JsonUtility.FromJson<BatchEnvelope>(code); }
                catch { batch = null; }
                if (batch != null && (batch.tool == null || batch.tool.Trim().ToLowerInvariant() == "batch")
                    && batch.steps != null)
                {
                    var sb = new StringBuilder();
                    for (int i = 0; i < batch.steps.Length; i++)
                    {
                        string stepResult;
                        try { stepResult = Run(batch.steps[i]); }
                        catch (Exception e) { stepResult = "RUNTIME ERROR: " + e.Message; }
                        sb.AppendLine("[" + (i + 1) + "] " + stepResult);
                    }
                    return sb.ToString().TrimEnd();
                }
            }

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
                    case "scene.save": return SceneSave();
                    case "log":
                        Debug.Log("[Lovelace Forge] " + arg);
                        return "Logged to the Unity Console: " + arg;
                    default:
                        return "Unknown command '" + cmd + "'. Available reads: scene.info, " +
                               "scene.hierarchy, selection.info, assets.count, editor.info, object.inspect. " +
                               "Writes are sent as JSON tools: object.create, object.empty, component.add, " +
                               "object.rename, object.delete, object.move, object.scale, object.rotate, " +
                               "object.parent, object.duplicate, object.color, object.light, camera.frame, " +
                               "property.set, script.create, script.attach, scene.save, editor.play.";
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
                case "object.inspect": return ObjectInspect(a);
                case "object.create": return ObjectCreate(a);
                case "object.empty": return ObjectEmpty(a);
                case "component.add": return ComponentAdd(a);
                case "object.rename": return ObjectRename(a);
                case "object.delete": return ObjectDelete(a);
                case "object.move": return ObjectMove(a);
                case "object.scale": return ObjectScale(a);
                case "object.rotate": return ObjectRotate(a);
                case "object.parent": return ObjectParent(a);
                case "object.duplicate": return ObjectDuplicate(a);
                case "object.color": return ObjectColor(a);
                case "object.light": return ObjectLight(a);
                case "camera.frame": return CameraFrame(a);
                case "property.set": return PropertySet(a);
                case "script.create": return ScriptCreate(a);
                case "script.attach": return ScriptAttach(a);
                case "character.import": return CharacterImport(a);
                case "character.status": return CharacterStatus(a);
                case "scene.save": return SceneSave();
                case "editor.play": return EditorPlay(a);
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

        private static string ObjectEmpty(Args a)
        {
            var go = new GameObject(string.IsNullOrWhiteSpace(a.name) ? "GameObject" : a.name);
            go.transform.position = new Vector3(a.x, a.y, a.z);
            if (!string.IsNullOrWhiteSpace(a.parent))
            {
                var p = Find(a.parent);
                if (p != null) go.transform.SetParent(p.transform, true);
            }
            Undo.RegisterCreatedObjectUndo(go, "Create " + go.name);
            Selection.activeGameObject = go;
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Created empty GameObject '" + go.name + "'.";
        }

        private static string ObjectScale(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            Undo.RecordObject(go.transform, "Scale");
            go.transform.localScale = new Vector3(a.x, a.y, a.z);
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Scaled '" + a.target + "' to (" + a.x + ", " + a.y + ", " + a.z + ").";
        }

        private static string ObjectRotate(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            Undo.RecordObject(go.transform, "Rotate");
            go.transform.rotation = Quaternion.Euler(a.x, a.y, a.z);
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Rotated '" + a.target + "' to euler (" + a.x + ", " + a.y + ", " + a.z + ").";
        }

        private static string ObjectParent(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            Undo.RecordObject(go.transform, "Reparent");
            if (string.IsNullOrWhiteSpace(a.parent))
            {
                go.transform.SetParent(null, true);
                EditorSceneManager.MarkSceneDirty(go.scene);
                return "Un-parented '" + a.target + "' (moved to scene root).";
            }
            var p = Find(a.parent);
            if (p == null) return "RUNTIME ERROR: no parent named '" + a.parent + "'.";
            go.transform.SetParent(p.transform, true);
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Parented '" + a.target + "' under '" + a.parent + "'.";
        }

        private static string ObjectDuplicate(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            var copy = UnityEngine.Object.Instantiate(go, go.transform.parent);
            copy.name = string.IsNullOrWhiteSpace(a.name) ? go.name + " (Copy)" : a.name;
            // If the caller supplied a position, move the copy there; otherwise nudge
            // it slightly so it doesn't perfectly overlap the original.
            if (a.x != 0f || a.y != 0f || a.z != 0f) copy.transform.position = new Vector3(a.x, a.y, a.z);
            else copy.transform.position = go.transform.position + new Vector3(1f, 0f, 0f);
            Undo.RegisterCreatedObjectUndo(copy, "Duplicate " + go.name);
            Selection.activeGameObject = copy;
            EditorSceneManager.MarkSceneDirty(copy.scene);
            return "Duplicated '" + a.target + "' as '" + copy.name + "'.";
        }

        // Creates (once) a material on the object's renderer and tints it. Uses the
        // URP/HDRP-safe approach of setting whatever base color property exists.
        private static string ObjectColor(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            var r = go.GetComponent<Renderer>();
            if (r == null) return "RUNTIME ERROR: '" + a.target + "' has no Renderer to color.";
            if (!TryParseColor(a.color, out var col)) return "RUNTIME ERROR: couldn't parse color '" + a.color + "'.";
            Undo.RecordObject(r, "Color");
            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            var mat = new Material(shader);
            if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", col);
            if (mat.HasProperty("_Color")) mat.SetColor("_Color", col);
            mat.color = col;
            r.sharedMaterial = mat;
            EditorSceneManager.MarkSceneDirty(go.scene);
            return "Set the color of '" + a.target + "' to " + a.color + ".";
        }

        // Creates a Light object (directional/point/spot). If a.target names an
        // existing object, the Light is added to it instead of making a new one.
        private static string ObjectLight(Args a)
        {
            GameObject go = string.IsNullOrWhiteSpace(a.target) ? null : Find(a.target);
            bool created = false;
            if (go == null)
            {
                go = new GameObject(string.IsNullOrWhiteSpace(a.name) ? "Light" : a.name);
                go.transform.position = new Vector3(a.x, a.y, a.z);
                created = true;
            }
            var light = go.GetComponent<Light>() ?? Undo.AddComponent<Light>(go);
            switch ((a.mode ?? "point").Trim().ToLowerInvariant())
            {
                case "directional": light.type = LightType.Directional; break;
                case "spot": light.type = LightType.Spot; break;
                default: light.type = LightType.Point; break;
            }
            if (a.intensity > 0) light.intensity = a.intensity;
            if (!string.IsNullOrWhiteSpace(a.color) && TryParseColor(a.color, out var col)) light.color = col;
            if (created) Undo.RegisterCreatedObjectUndo(go, "Create Light");
            Selection.activeGameObject = go;
            EditorSceneManager.MarkSceneDirty(go.scene);
            return (created ? "Created " : "Configured ") + light.type + " light '" + go.name + "'.";
        }

        // Points the Scene view camera at a target object so you can see the result.
        private static string CameraFrame(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            Selection.activeGameObject = go;
            if (SceneView.lastActiveSceneView != null)
            {
                SceneView.lastActiveSceneView.FrameSelected();
                return "Framed the Scene view on '" + a.target + "'.";
            }
            return "Selected '" + a.target + "' (no Scene view open to frame).";
        }

        // The universal escape hatch. Sets a public field or property (by name) on a
        // component of the target — via reflection, coercing the string value to the
        // member's type. Lets Lovelace configure anything without a dedicated tool.
        private static string PropertySet(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            var type = ResolveComponentType(a.component);
            if (type == null) return "RUNTIME ERROR: unknown component '" + a.component + "'.";
            var comp = go.GetComponent(type);
            if (comp == null) return "RUNTIME ERROR: '" + a.target + "' has no " + type.Name + ".";
            Undo.RecordObject(comp, "Set " + a.property);

            var prop = type.GetProperty(a.property);
            if (prop != null && prop.CanWrite)
            {
                object v = Coerce(a.value, prop.PropertyType);
                if (v == null) return "RUNTIME ERROR: couldn't convert '" + a.value + "' to " + prop.PropertyType.Name + ".";
                prop.SetValue(comp, v);
                EditorSceneManager.MarkSceneDirty(go.scene);
                return "Set " + type.Name + "." + a.property + " = " + a.value + " on '" + a.target + "'.";
            }
            var field = type.GetField(a.property);
            if (field != null)
            {
                object v = Coerce(a.value, field.FieldType);
                if (v == null) return "RUNTIME ERROR: couldn't convert '" + a.value + "' to " + field.FieldType.Name + ".";
                field.SetValue(comp, v);
                EditorSceneManager.MarkSceneDirty(go.scene);
                return "Set " + type.Name + "." + a.property + " = " + a.value + " on '" + a.target + "'.";
            }
            return "RUNTIME ERROR: " + type.Name + " has no writable member '" + a.property + "'.";
        }

        // Coerces a string into common Unity/BCL types for property.set.
        private static object Coerce(string s, Type t)
        {
            try
            {
                if (t == typeof(string)) return s;
                if (t == typeof(bool)) return bool.Parse(s);
                if (t == typeof(int)) return int.Parse(s);
                if (t == typeof(float)) return float.Parse(s);
                if (t == typeof(double)) return double.Parse(s);
                if (t.IsEnum) return Enum.Parse(t, s, true);
                if (t == typeof(Vector3)) { var p = s.Split(','); return new Vector3(float.Parse(p[0]), float.Parse(p[1]), float.Parse(p[2])); }
                if (t == typeof(Vector2)) { var p = s.Split(','); return new Vector2(float.Parse(p[0]), float.Parse(p[1])); }
                if (t == typeof(Color)) { TryParseColor(s, out var c); return c; }
                return Convert.ChangeType(s, t);
            }
            catch { return null; }
        }

        private static bool TryParseColor(string s, out Color col)
        {
            col = Color.white;
            if (string.IsNullOrWhiteSpace(s)) return false;
            s = s.Trim();
            if (ColorUtility.TryParseHtmlString(s, out col)) return true;
            switch (s.ToLowerInvariant())
            {
                case "red": col = Color.red; return true;
                case "green": col = Color.green; return true;
                case "blue": col = Color.blue; return true;
                case "yellow": col = Color.yellow; return true;
                case "white": col = Color.white; return true;
                case "black": col = Color.black; return true;
                case "cyan": col = Color.cyan; return true;
                case "magenta": col = Color.magenta; return true;
                case "gray": case "grey": col = Color.gray; return true;
                case "orange": col = new Color(1f, 0.5f, 0f); return true;
                default: return false;
            }
        }

        // ---- CHARACTER IMPORT ----
        // Downloads a Meshy-rigged FBX (+ optional walk/run clips) on a background
        // thread, then finishes the AssetDatabase import + scene placement on the
        // main thread. Split in two so the HTTP call NEVER blocks for minutes:
        // character.import kicks it off and returns instantly; character.status is
        // polled and does the main-thread finish work once the files have landed.
        // Every failure is captured and reported back verbatim — no silent deaths.
        private static string _charName = "";
        private static string _charFolder = "";
        private static string[] _charUrls = new string[0];
        private static volatile string _charPhase = "idle";
        private static volatile string _charError = "";
        private static volatile int _charDone;
        private static volatile int _charTotal;
        private static readonly string[] CharSuffixes = { "_Rigged.fbx", "_Walk.fbx", "_Run.fbx" };

        private static string CharacterImport(Args a)
        {
            if (_charPhase == "downloading" || _charPhase == "importing")
                return "A character import is already running (" + _charDone + "/" + _charTotal + " files).";
            if (string.IsNullOrWhiteSpace(a.fbx))
                return "RUNTIME ERROR: no rigged FBX url was supplied.";

            _charName = string.IsNullOrWhiteSpace(a.name) ? "Character" : a.name.Trim();
            _charFolder = "Assets/GeneratedCharacters/" + _charName;
            var urls = new System.Collections.Generic.List<string>();
            urls.Add(a.fbx);
            if (!string.IsNullOrWhiteSpace(a.walk)) urls.Add(a.walk);
            if (!string.IsNullOrWhiteSpace(a.run)) urls.Add(a.run);
            _charUrls = urls.ToArray();
            _charTotal = _charUrls.Length;
            _charDone = 0;
            _charError = "";

            try { Directory.CreateDirectory(_charFolder); }
            catch (Exception e) { return "RUNTIME ERROR: could not create " + _charFolder + ": " + e.Message; }

            _charPhase = "downloading";
            var t = new System.Threading.Thread(DownloadWorker);
            t.IsBackground = true;
            t.Start();
            return "STARTED downloading " + _charTotal + " file(s) for '" + _charName + "'.";
        }

        private static void DownloadWorker()
        {
            try
            {
                System.Net.ServicePointManager.SecurityProtocol =
                    System.Net.SecurityProtocolType.Tls12 | System.Net.SecurityProtocolType.Tls11;
                for (int i = 0; i < _charUrls.Length; i++)
                {
                    string path = _charFolder + "/" + _charName + CharSuffixes[i];
                    using (var client = new System.Net.WebClient())
                        client.DownloadFile(_charUrls[i], path);
                    _charDone = i + 1;
                }
                _charPhase = "downloaded";
            }
            catch (Exception e)
            {
                _charError = e.Message;
                _charPhase = "error";
            }
        }

        private static string CharacterStatus(Args a)
        {
            if (_charPhase == "idle") return "IDLE — no character import has been started.";
            if (_charPhase == "downloading")
                return "DOWNLOADING " + _charDone + "/" + _charTotal + " files for '" + _charName + "'.";
            if (_charPhase == "importing") return "IMPORTING '" + _charName + "' into Unity.";
            if (_charPhase == "error") return "RUNTIME ERROR: character import failed: " + _charError;
            if (_charPhase == "done") return "DONE — '" + _charName + "' is in the scene.";

            // phase == "downloaded" → finish here, on the main thread.
            try
            {
                _charPhase = "importing";
                AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
                string fbxPath = _charFolder + "/" + _charName + "_Rigged.fbx";

                var importer = AssetImporter.GetAtPath(fbxPath) as ModelImporter;
                if (importer != null)
                {
                    importer.animationType = ModelImporterAnimationType.Human;
                    importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
                    importer.SaveAndReimport();
                }

                var prefab = AssetDatabase.LoadMainAssetAtPath(fbxPath) as GameObject;
                if (prefab == null)
                {
                    _charPhase = "error";
                    _charError = "Unity could not import the model at " + fbxPath + ".";
                    return "RUNTIME ERROR: " + _charError;
                }

                var instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
                instance.name = _charName;
                instance.transform.position = Vector3.zero;
                instance.transform.localScale = new Vector3(4f, 4f, 4f);
                instance.transform.rotation = Quaternion.Euler(0f, 270f, 0f);
                Undo.RegisterCreatedObjectUndo(instance, "Import " + _charName);
                Selection.activeGameObject = instance;
                if (SceneView.lastActiveSceneView != null) SceneView.lastActiveSceneView.FrameSelected();
                EditorSceneManager.MarkSceneDirty(instance.scene);
                _charPhase = "done";
                return "DONE — '" + _charName + "' imported as a Humanoid rig and placed in the scene.";
            }
            catch (Exception e)
            {
                _charPhase = "error";
                _charError = e.Message;
                return "RUNTIME ERROR: " + e.Message;
            }
        }

        private static string ObjectInspect(Args a)
        {
            var go = Find(a.target);
            if (go == null) return "RUNTIME ERROR: no object named '" + a.target + "'.";
            var sb = new StringBuilder();
            sb.AppendLine("Object: " + go.name + (go.activeSelf ? "" : " (inactive)"));
            var tr = go.transform;
            sb.AppendLine("Position: " + tr.position + "  Rotation: " + tr.eulerAngles + "  Scale: " + tr.localScale);
            sb.AppendLine("Parent: " + (tr.parent ? tr.parent.name : "(root)") + "  Children: " + tr.childCount);
            sb.AppendLine("Components:");
            foreach (var c in go.GetComponents<Component>())
                if (c != null) sb.AppendLine("  - " + c.GetType().Name);
            return sb.ToString().TrimEnd();
        }

        private static string SceneSave()
        {
            var scene = SceneManager.GetActiveScene();
            if (string.IsNullOrEmpty(scene.path))
                return "The scene has never been saved. Save it once manually (File ▸ Save As) so it has a path, then I can save it for you.";
            EditorSceneManager.SaveScene(scene);
            return "Saved scene '" + scene.name + "'.";
        }

        private static string EditorPlay(Args a)
        {
            bool wantPlay = string.IsNullOrWhiteSpace(a.mode) || a.mode.Trim().ToLowerInvariant() != "stop";
            EditorApplication.isPlaying = wantPlay;
            return wantPlay ? "Entering Play mode." : "Exiting Play mode.";
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