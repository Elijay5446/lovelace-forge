import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getMeshyKey, meshyFetch } from '../../shared/meshy.ts';

// Starts the Meshy image-to-3D pipeline for an already-uploaded character image
// (the frontend uploads to Base44 public storage and passes image_url), and
// creates the tracking MeshyJob record.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const imageUrl = typeof body?.image_url === "string" ? body.image_url.trim() : "";
    const characterName = typeof body?.character_name === "string" ? body.character_name.trim() : "";
    if (!imageUrl || !characterName) {
      return Response.json({ error: "image_url and character_name are required" }, { status: 400 });
    }

    const { key } = await getMeshyKey(base44);
    if (!key) {
      return Response.json({ error: "Please connect your Meshy API key" }, { status: 400 });
    }

    const res = await meshyFetch(key, "/image-to-3d", {
      method: "POST",
      body: JSON.stringify({
        image_url: imageUrl,
        ai_model: "meshy-6",
        model_type: "standard",
        should_texture: true,
        enable_pbr: true,
        texture_resolution: "2k",
        pose_mode: "t-pose",
        target_formats: ["glb", "fbx"],
        should_remesh: true,
        image_enhancement: true,
        remove_lighting: true,
        moderation: true,
      }),
    });

    const taskId = res.data?.result?.task_id || res.data?.result;
    if (!res.ok || !taskId) {
      return Response.json(
        { error: res.data?.message || ("Meshy could not start 3D generation (status " + res.status + ")") },
        { status: 502 }
      );
    }

    const job = await base44.entities.MeshyJob.create({
      character_name: characterName,
      status: "3d_generating",
      image_url: imageUrl,
      meshy_3d_task_id: String(taskId),
    });

    return Response.json({ job_id: job.id, task_id: String(taskId), status: "3d_generating" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});