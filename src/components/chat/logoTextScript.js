// C# behaviour that spawns a floating "BASE44" text object beside the logo cube.
// It lives on the Floor (a stationary object) so the text stays upright while the
// cube spins, and it gently bobs to feel alive in the Scene view.
export const LOGO_TEXT_CS = `using UnityEngine;

[ExecuteAlways]
public class Base44LogoText : MonoBehaviour
{
    const string ChildName = "Base44LogoText_Mesh";

    Transform textTransform;
    Vector3 basePosition = new Vector3(2.9f, 1.6f, 0f);

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
        textTransform.localPosition = basePosition;
        textTransform.localRotation = Quaternion.identity;
        textTransform.localScale = Vector3.one;

        var mesh = textTransform.GetComponent<TextMesh>();
        if (mesh == null) mesh = textTransform.gameObject.AddComponent<TextMesh>();

        mesh.text = "BASE44";
        mesh.fontSize = 96;
        mesh.characterSize = 0.16f;
        mesh.anchor = TextAnchor.MiddleLeft;
        mesh.alignment = TextAlignment.Left;
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

        float bob = Mathf.Sin(Time.realtimeSinceStartup * 1.4f) * 0.08f;
        textTransform.localPosition = basePosition + new Vector3(0f, bob, 0f);
    }
}
`;