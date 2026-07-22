using UnityEditor;
using UnityEngine;

namespace LovelaceForge.Bridge
{
    /// <summary>
    /// The Tools → Lovelace Forge menu and bridge status window.
    /// </summary>
    public class LovelaceBridgeWindow : EditorWindow
    {
        [MenuItem("Tools/Lovelace Forge/Start Bridge")]
        public static void StartMenu()
        {
            BridgeServer.Start();
            ShowWindow();
        }

        [MenuItem("Tools/Lovelace Forge/Stop Bridge")]
        public static void StopMenu() => BridgeServer.Stop();

        [MenuItem("Tools/Lovelace Forge/About")]
        public static void ShowWindow()
        {
            var w = GetWindow<LovelaceBridgeWindow>(false, "Lovelace Forge Bridge", true);
            w.minSize = new Vector2(340, 320);
        }

        private void Update() => Repaint();

        private void OnGUI()
        {
            GUILayout.Space(8);

            var header = new GUIStyle(GUI.skin.label) { fontSize = 15, fontStyle = FontStyle.Bold };
            GUILayout.Label("Lovelace Forge Bridge", header);
            GUILayout.Label("Live link between Lovelace and your editor.", EditorStyles.miniLabel);
            GUILayout.Space(10);

            // Status pill
            bool running = BridgeServer.IsRunning;
            var pill = new GUIStyle(GUI.skin.box);
            pill.normal.background = MakeTex(running ? new Color(0.12f, 0.45f, 0.20f) : new Color(0.45f, 0.12f, 0.12f));
            GUILayout.BeginVertical(pill, GUILayout.Height(28));
            GUILayout.Label(running ? "●  Connected   " + BridgeServer.Url : "●  Not running", EditorStyles.whiteBoldLabel);
            GUILayout.EndVertical();
            GUILayout.Space(10);

            if (running)
            {
                if (GUILayout.Button("Stop Bridge", GUILayout.Height(32)))
                    BridgeServer.Stop();
            }
            else
            {
                if (GUILayout.Button("Start Bridge", GUILayout.Height(32)))
                    BridgeServer.Start();
            }

            GUILayout.Space(12);
            GUILayout.Label("How it works", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "1. Start the bridge — it listens on localhost:9876.\n" +
                "2. Expose it with a Cloudflare tunnel:\n     cloudflared tunnel --url http://localhost:9876\n" +
                "3. Paste the printed https://...trycloudflare.com URL into\n     Lovelace Forge → Connect Unity → Step 3.\n" +
                "4. Ask Lovelace to inspect your scene or run C#.",
                MessageType.Info);

            GUILayout.Space(6);
            GUILayout.Label("Local test", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "With the bridge running, open in a browser:\nhttp://localhost:9876/health",
                MessageType.None);

            GUILayout.FlexibleSpace();
            GUILayout.Label("Bridge v" + BridgeServer.Version + " · Unity " + Application.unityVersion, EditorStyles.miniLabel);
        }

        private static Texture2D MakeTex(Color c)
        {
            var t = new Texture2D(1, 1);
            t.SetPixel(0, 0, c);
            t.Apply();
            return t;
        }
    }
}