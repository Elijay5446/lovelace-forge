// C# behaviour that spawns a floating "BASE44" text object beside the logo cube.
// It lives on the Floor (a stationary object) so the text stays upright while the
// cube spins, and it gently bobs to feel alive in the Scene view.
export const LOGO_TEXT_CS = `using UnityEngine;

[ExecuteAlways]
public class Base44LogoText : MonoBehaviour
{
    const string ChildName = "Base44LogoText_Mesh";

    Transform textTransform;
    Vector3 basePosition;
    float bobScale = 1f;

    void OnEnable()
    {
        EnsureText();
    }

    void EnsureText()
    {
        var existing = transform.Find(ChildName);
        if (existing == null)
        {
            var go = new GameObject(ChildName);
            go.transform.SetParent(transform, false);
            existing = go.transform;
        }
        textTransform = existing;

        // The Floor is scaled (4,1,4) — compensate so the text isn't stretched
        // or pushed far away, and world-space placement stays at (2.9, 1.6, 0).
        Vector3 ps = transform.lossyScale;
        float sx = Mathf.Approximately(ps.x, 0f) ? 1f : ps.x;
        float sy = Mathf.Approximately(ps.y, 0f) ? 1f : ps.y;
        float sz = Mathf.Approximately(ps.z, 0f) ? 1f : ps.z;
        basePosition = new Vector3(2.9f / sx, 1.6f / sy, 0f);
        bobScale = 1f / sy;

        textTransform.localPosition = basePosition;
        textTransform.localRotation = Quaternion.identity;
        textTransform.localScale = new Vector3(1f / sx, 1f / sy, 1f / sz);

        var mesh = textTransform.GetComponent<TextMesh>();
        if (mesh == null) mesh = textTransform.gameObject.AddComponent<TextMesh>();

        mesh.text = "BASE44";
        mesh.fontSize = 96;
        mesh.characterSize = 0.16f;
        mesh.anchor = TextAnchor.MiddleCenter;
        mesh.alignment = TextAlignment.Center;
        mesh.color = new Color(1f, 0.42f, 0f);

        if (mesh.font == null)
        {
            var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (font == null) font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            if (font != null)
            {
                mesh.font = font;
                var renderer = textTransform.GetComponent<MeshRenderer>();
                if (renderer != null) renderer.sharedMaterial = font.material;
            }
        }
    }

    void Update()
    {
        if (textTransform == null)
        {
            EnsureText();
            if (textTransform == null) return;
        }

        float bob = Mathf.Sin(Time.realtimeSinceStartup * 1.4f) * 0.08f * bobScale;
        textTransform.localPosition = basePosition + new Vector3(0f, bob, 0f);

        // Billboard: always face the viewing camera so the text can never read
        // backwards/mirrored, no matter which side the Scene view orbits to.
        Camera cam = null;
#if UNITY_EDITOR
        if (UnityEditor.SceneView.lastActiveSceneView != null)
            cam = UnityEditor.SceneView.lastActiveSceneView.camera;
#endif
        if (cam == null) cam = Camera.main;
        if (cam != null)
        {
            Vector3 toCam = textTransform.position - cam.transform.position;
            toCam.y = 0f; // yaw only, keeps the text upright
            if (toCam.sqrMagnitude > 0.001f)
                textTransform.rotation = Quaternion.LookRotation(toCam);
        }
    }
}
`;