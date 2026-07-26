import React from "react";
import { FileCode2 } from "lucide-react";

// Dependency-free, Unity-6-compatible CodeRunner.cs. It does NOT reference
// Microsoft.CodeAnalysis (Roslyn) — that package isn't available to plain Unity
// projects, and referencing it makes the whole editor assembly fail to compile,
// which is exactly why the Tools menu never appeared. Instead this drives the
// Roslyn compiler BINARY (csc) that ships inside every Unity install as an
// external process, so there are zero project-level dependencies.
// Served in-browser as a Blob so the download is always the fixed version.
export const CODE_RUNNER_CS = `using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using UnityEngine;
using UnityEditor;
using Debug = UnityEngine.Debug;

namespace LovelaceForge.Bridge
{
    /// <summary>
    /// Compiles and runs a C# snippet on the main thread WITHOUT any Roslyn NuGet
    /// reference. The snippet is the body of \`static string Execute()\` — write
    /// statements and \`return "your result";\` to send data back to Lovelace. It
    /// can use the full UnityEngine / UnityEditor API.
    ///
    /// How it compiles: Unity ships the Roslyn compiler as a standalone assembly
    /// (Data/Tools/Roslyn/csc.dll or csc-net472.exe). We shell out to it with the
    /// current editor's loaded assemblies as references, produce a temp DLL, load
    /// it, and invoke Execute(). No package needs to be installed, so this file
    /// always compiles and the Tools ▸ Lovelace Forge menu always appears.
    /// </summary>
    public static class CodeRunner
    {
        private static string _cscPath;
        private static List<string> _refPaths;

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

            string tempDir = Path.Combine(Path.GetTempPath(), "LovelaceForge_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(tempDir);
            string srcFile = Path.Combine(tempDir, "Snippet.cs");
            string dllFile = Path.Combine(tempDir, "Snippet.dll");
            string rspFile = Path.Combine(tempDir, "compile.rsp");

            try
            {
                File.WriteAllText(srcFile, source);

                string csc = GetCscPath();
                if (csc == null)
                    return "COMPILE ERROR: could not locate Unity's Roslyn compiler (csc). " +
                           "Expected under <UnityEditor>/Data/Tools/Roslyn.";

                // A response file avoids Windows command-line length limits — there
                // can be hundreds of reference assemblies.
                var rsp = new StringBuilder();
                rsp.AppendLine("-target:library");
                rsp.AppendLine("-nostdlib+");
                rsp.AppendLine("-nologo");
                rsp.AppendLine("-optimize+");
                rsp.AppendLine("-out:\\"" + dllFile + "\\"");
                foreach (var r in GetReferencePaths())
                    rsp.AppendLine("-r:\\"" + r + "\\"");
                rsp.AppendLine("\\"" + srcFile + "\\"");
                File.WriteAllText(rspFile, rsp.ToString());

                var psi = new ProcessStartInfo
                {
                    FileName = csc,
                    Arguments = "\\"@" + rspFile + "\\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                };

                // csc.dll must be launched through the bundled dotnet/mono host.
                if (csc.EndsWith(".dll", StringComparison.OrdinalIgnoreCase))
                {
                    string host = GetDotnetHost();
                    if (host == null)
                        return "COMPILE ERROR: found csc.dll but no dotnet host to run it.";
                    psi.FileName = host;
                    psi.Arguments = "\\"" + csc + "\\" \\"@" + rspFile + "\\"";
                }

                string stdout, stderr;
                using (var proc = Process.Start(psi))
                {
                    stdout = proc.StandardOutput.ReadToEnd();
                    stderr = proc.StandardError.ReadToEnd();
                    proc.WaitForExit(35000);
                }

                if (!File.Exists(dllFile))
                {
                    var errText = (stdout + "\\n" + stderr).Trim();
                    return "COMPILE ERROR:\\n" + (string.IsNullOrEmpty(errText) ? "compiler produced no output DLL." : errText);
                }

                byte[] bytes = File.ReadAllBytes(dllFile);
                Assembly assembly = Assembly.Load(bytes);

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
            catch (Exception e)
            {
                return "COMPILE ERROR: " + e.Message;
            }
            finally
            {
                try { Directory.Delete(tempDir, true); } catch { }
            }
        }

        /// <summary>Locate the Roslyn csc that ships inside the Unity editor install.</summary>
        private static string GetCscPath()
        {
            if (_cscPath != null) return _cscPath.Length == 0 ? null : _cscPath;

            // EditorApplication.applicationContentsPath -> .../Unity/Editor/Data
            string data = EditorApplication.applicationContentsPath;
            var candidates = new[]
            {
                Path.Combine(data, "Tools", "Roslyn", "csc.dll"),
                Path.Combine(data, "Tools", "Roslyn", "csc.exe"),
                Path.Combine(data, "DotNetSdkRoslyn", "csc.dll"),
                Path.Combine(data, "Tools", "RoslynNet6", "csc.dll"),
            };
            foreach (var c in candidates)
                if (File.Exists(c)) { _cscPath = c; return c; }

            // Fallback: search for any csc under the Tools folder.
            try
            {
                string tools = Path.Combine(data, "Tools");
                if (Directory.Exists(tools))
                {
                    var hit = Directory.GetFiles(tools, "csc.*", SearchOption.AllDirectories)
                        .FirstOrDefault(f => f.EndsWith("csc.dll", StringComparison.OrdinalIgnoreCase)
                                          || f.EndsWith("csc.exe", StringComparison.OrdinalIgnoreCase));
                    if (hit != null) { _cscPath = hit; return hit; }
                }
            }
            catch { }

            _cscPath = "";
            return null;
        }

        /// <summary>Locate a dotnet/mono host capable of running csc.dll.</summary>
        private static string GetDotnetHost()
        {
            string data = EditorApplication.applicationContentsPath;
            bool win = Application.platform == RuntimePlatform.WindowsEditor;
            var candidates = new[]
            {
                Path.Combine(data, "NetCoreRuntime", win ? "dotnet.exe" : "dotnet"),
                Path.Combine(data, "Tools", "netcorerun", win ? "netcorerun.exe" : "netcorerun"),
                Path.Combine(data, "MonoBleedingEdge", "bin", win ? "mono.exe" : "mono"),
            };
            foreach (var c in candidates)
                if (File.Exists(c)) return c;
            return win ? "dotnet.exe" : "dotnet";
        }

        /// <summary>
        /// Reference paths = every assembly currently loaded in the editor that has
        /// a real file on disk, so the snippet sees the full Unity/System API.
        /// </summary>
        private static List<string> GetReferencePaths()
        {
            if (_refPaths != null) return _refPaths;

            var paths = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                if (asm.IsDynamic) continue;
                string location;
                try { location = asm.Location; }
                catch { continue; }
                if (string.IsNullOrEmpty(location) || !File.Exists(location)) continue;
                if (seen.Add(location)) paths.Add(location);
            }

            _refPaths = paths;
            return paths;
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
        the Roslyn package (<span className="font-mono text-[11px] text-amber-300">Microsoft.CodeAnalysis</span>),
        which plain Unity projects can't resolve — so the whole editor assembly failed and the Tools
        menu never appeared. Download the fixed, dependency-free file below and drop it into your{" "}
        <span className="text-stone-200">LovelaceForgeBridge</span> folder, replacing the old one.
        Unity recompiles cleanly and the <span className="text-stone-200">Tools ▸ Lovelace Forge</span>{" "}
        menu appears.
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