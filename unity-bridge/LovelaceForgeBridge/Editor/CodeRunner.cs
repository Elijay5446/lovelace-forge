using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using Microsoft.CSharp;
using System.CodeDom.Compiler;
using UnityEngine;
using UnityEditor;

namespace LovelaceForge.Bridge
{
    /// <summary>
    /// Compiles and runs a C# snippet in-process (no domain reload) on the main thread.
    /// The snippet is the body of `static string Execute()` — write statements, and
    /// `return "your result";` to send data back to Lovelace. It can use the full
    /// UnityEngine / UnityEditor API. Uses the Mono CodeDom compiler bundled with Unity.
    /// </summary>
    public static class CodeRunner
    {
        public static string Run(string code)
        {
            var provider = new CSharpCodeProvider(
                new Dictionary<string, string> { { "CompilerVersion", "v4.0" } });

            var pars = new CompilerParameters
            {
                GenerateInMemory = true,
                TreatWarningsAsErrors = false,
                IncludeDebugInformation = false,
                GenerateExecutable = false,
            };

            // Reference the assemblies actually loaded in the editor so the snippet
            // can call into UnityEngine / UnityEditor / System.
            pars.ReferencedAssemblies.Add(typeof(UnityEngine.Object).Assembly.Location);
            pars.ReferencedAssemblies.Add(typeof(UnityEditor.EditorWindow).Assembly.Location);
            pars.ReferencedAssemblies.Add(typeof(System.Linq.Enumerable).Assembly.Location);
            pars.ReferencedAssemblies.Add(typeof(object).Assembly.Location);
            pars.ReferencedAssemblies.Add(typeof(CodeRunner).Assembly.Location);

            string source = $@"using UnityEngine;
using UnityEditor;
using System;
using System.Linq;
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

            var results = provider.CompileAssemblyFromSource(pars, source);

            var sb = new StringBuilder();
            foreach (CompilerError e in results.Errors)
                if (!e.IsWarning)
                    sb.AppendLine(e.ErrorText + " (line " + e.Line + ")");

            if (results.Errors.HasErrors)
                return "COMPILE ERROR:\n" + sb;

            var type = results.CompiledAssembly.GetType("LovelaceForge.Runtime.RunCommand");
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
}