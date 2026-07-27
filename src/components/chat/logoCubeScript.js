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
        EnsureUprightMesh();
        EnsureMaterial();
        BeginDownload();
    }

    // Unity's built-in cube shares a UV layout where the bottom (and, depending
    // on version, one side) is rotated 180 degrees — which makes the logo appear
    // upside down on that face. We build our own 24-vertex cube where every face
    // gets its own upright 0..1 UV quad, so the logo reads correctly from every
    // angle.
    void EnsureUprightMesh()
    {
        var filter = GetComponent<MeshFilter>();
        if (filter == null) return;
        if (filter.sharedMesh != null && filter.sharedMesh.name == "Base44LogoCubeMesh") return;

        Vector3[] normals6 = {
            Vector3.forward, Vector3.back, Vector3.right, Vector3.left, Vector3.up, Vector3.down
        };
        Vector3[] ups6 = {
            Vector3.up, Vector3.up, Vector3.up, Vector3.up, Vector3.back, Vector3.forward
        };

        var verts = new Vector3[24];
        var norms = new Vector3[24];
        var uvs = new Vector2[24];
        var tris = new int[36];

        for (int f = 0; f < 6; f++)
        {
            Vector3 n = normals6[f];
            Vector3 up = ups6[f];
            Vector3 right = Vector3.Cross(-n, up);
            Vector3 c = n * 0.5f;
            int v = f * 4;

            verts[v + 0] = c - right * 0.5f - up * 0.5f;
            verts[v + 1] = c + right * 0.5f - up * 0.5f;
            verts[v + 2] = c + right * 0.5f + up * 0.5f;
            verts[v + 3] = c - right * 0.5f + up * 0.5f;

            uvs[v + 0] = new Vector2(0f, 0f);
            uvs[v + 1] = new Vector2(1f, 0f);
            uvs[v + 2] = new Vector2(1f, 1f);
            uvs[v + 3] = new Vector2(0f, 1f);

            for (int k = 0; k < 4; k++) norms[v + k] = n;

            int t = f * 6;
            tris[t + 0] = v + 0; tris[t + 1] = v + 2; tris[t + 2] = v + 1;
            tris[t + 3] = v + 0; tris[t + 4] = v + 3; tris[t + 5] = v + 2;
        }

        var mesh = new Mesh();
        mesh.name = "Base44LogoCubeMesh";
        mesh.vertices = verts;
        mesh.normals = norms;
        mesh.uv = uvs;
        mesh.triangles = tris;
        mesh.RecalculateBounds();
        mesh.RecalculateTangents();
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