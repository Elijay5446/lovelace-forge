// The C# behaviour the demo writes into the user's Unity project. It textures
// the cube with the Base44 logo on ALL six faces (downloaded at runtime, so no
// asset import step is needed), spins it, and pulses its emission for sparkle.
// Runs in the editor too ([ExecuteAlways]) so the scene looks right without
// pressing Play.
export const LOGO_CUBE_CS = `using UnityEngine;
using UnityEngine.Networking;

[ExecuteAlways]
public class Base44LogoCube : MonoBehaviour
{
    public string logoUrl = "https://media.base44.com/images/public/6a5fa4e30616b868abb9e3db/6caabebae_Base44logo.png";
    public float degreesPerSecond = 40f;
    public Color glowColor = new Color(1f, 0.42f, 0f);
    public float glowStrength = 1.6f;

    private UnityWebRequest _request;
    private Material _material;
    private float _lastTime;

    void OnEnable()
    {
        _lastTime = Time.realtimeSinceStartup;
        FixFlippedFace();
        EnsureMaterial();
        BeginDownload();
    }

    // Unity's built-in cube UVs the bottom face rotated 180 degrees, so the logo
    // reads upside down there. Take a fresh copy of the real primitive cube mesh
    // (so any earlier edit is discarded) and flip just that face's UVs.
    void FixFlippedFace()
    {
        var filter = GetComponent<MeshFilter>();
        if (filter == null) return;
        if (filter.sharedMesh != null && filter.sharedMesh.name == "Base44LogoCubeMesh_v4") return;

        var temp = GameObject.CreatePrimitive(PrimitiveType.Cube);
        var source = temp.GetComponent<MeshFilter>().sharedMesh;
        var mesh = Instantiate(source);
        DestroyImmediate(temp);

        mesh.name = "Base44LogoCubeMesh_v4";
        // Unity's built-in cube UVs aren't consistently oriented face to face, so
        // rather than patching them, rebuild every face's UVs from its normal and
        // vertex position. Result: the logo reads upright on all six faces.
        var normals = mesh.normals;
        var verts = mesh.vertices;
        var uv = new Vector2[verts.Length];
        for (int i = 0; i < verts.Length; i++)
        {
            Vector3 n = normals[i];
            Vector3 p = verts[i];
            if (n.y > 0.5f) uv[i] = new Vector2(p.x + 0.5f, 1f - (p.z + 0.5f));
            else if (n.y < -0.5f) uv[i] = new Vector2(p.x + 0.5f, p.z + 0.5f);
            else
            {
                Vector3 right = Vector3.Cross(Vector3.up, n);
                float u = Vector3.Dot(p, right) + 0.5f;
                uv[i] = new Vector2(u, p.y + 0.5f);
            }
        }
        mesh.uv = uv;
        filter.sharedMesh = mesh;
    }

    void EnsureMaterial()
    {
        var renderer = GetComponent<Renderer>();
        if (renderer == null) return;

        Shader shader = Shader.Find("Universal Render Pipeline/Lit");
        if (shader == null) shader = Shader.Find("Standard");
        if (shader == null) shader = Shader.Find("Sprites/Default");

        _material = new Material(shader);
        _material.name = "Base44LogoMaterial";
        SetColor("_BaseColor", Color.white);
        SetColor("_Color", Color.white);
        _material.EnableKeyword("_EMISSION");
        renderer.sharedMaterial = _material;
    }

    void BeginDownload()
    {
        if (string.IsNullOrEmpty(logoUrl)) return;
        _request = UnityWebRequestTexture.GetTexture(logoUrl);
        _request.SendWebRequest();
    }

    void SetColor(string prop, Color c)
    {
        if (_material != null && _material.HasProperty(prop)) _material.SetColor(prop, c);
    }

    void SetTexture(Texture tex)
    {
        if (_material == null) return;
        if (_material.HasProperty("_BaseMap")) _material.SetTexture("_BaseMap", tex);
        if (_material.HasProperty("_MainTex")) _material.SetTexture("_MainTex", tex);
        if (_material.HasProperty("_EmissionMap")) _material.SetTexture("_EmissionMap", tex);
    }

    void Update()
    {
        float now = Time.realtimeSinceStartup;
        float dt = Mathf.Clamp(now - _lastTime, 0f, 0.2f);
        _lastTime = now;

        if (_request != null && _request.isDone)
        {
            if (_request.result == UnityWebRequest.Result.Success)
            {
                Texture2D tex = DownloadHandlerTexture.GetContent(_request);
                if (tex != null)
                {
                    tex.wrapMode = TextureWrapMode.Clamp;
                    SetTexture(tex);
                }
            }
            else
            {
                Debug.LogWarning("[Base44LogoCube] Logo download failed: " + _request.error);
            }
            _request.Dispose();
            _request = null;
        }

        transform.Rotate(Vector3.up, degreesPerSecond * dt, Space.World);

        float pulse = 0.55f + 0.45f * Mathf.Sin(now * 2f);
        SetColor("_EmissionColor", glowColor * glowStrength * pulse);
    }

    void OnDisable()
    {
        if (_request != null) { _request.Dispose(); _request = null; }
    }
}
`;