import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getMeshyKey, meshyFetch } from '../../shared/meshy.ts';

// Polls one MeshyJob and auto-advances the pipeline: 3D generation → (auto-start)
// rigging → complete. Returns { status, progress, job } so the frontend needs
// exactly one poll endpoint.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const jobId = body?.job_id;
    if (!jobId) return Response.json({ error: "job_id is required" }, { status: 400 });

    let job = await base44.entities.MeshyJob.get(jobId).catch(() => null);
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

    // Terminal states: no Meshy call needed.
    if (job.status === "complete") return Response.json({ status: "complete", progress: 100, job });
    if (job.status === "failed") {
      return Response.json({ status: "failed", error: job.error_message || "Generation failed", job });
    }

    const { key } = await getMeshyKey(base44);
    if (!key) return Response.json({ error: "Please connect your Meshy API key" }, { status: 400 });

    if (job.status === "3d_generating" || job.status === "uploading") {
      const res = await meshyFetch(key, "/image-to-3d/" + job.meshy_3d_task_id);
      const t = res.data || {};

      if (t.status === "SUCCEEDED") {
        await base44.entities.MeshyJob.update(job.id, {
          status: "3d_complete",
          model_glb_url: t.model_urls?.glb || "",
          model_fbx_url: t.model_urls?.fbx || "",
          thumbnail_url: t.thumbnail_url || "",
        });
        // Auto-start rigging — pass the 3D task ID directly (no re-upload).
        const rig = await meshyFetch(key, "/rigging", {
          method: "POST",
          body: JSON.stringify({ input_task_id: job.meshy_3d_task_id }),
        });
        const rigTaskId = rig.data?.result?.task_id || rig.data?.result;
        if (!rig.ok || !rigTaskId) {
          const errMsg = rig.data?.message || ("Rigging could not start (status " + rig.status + ")");
          job = await base44.entities.MeshyJob.update(job.id, { status: "failed", error_message: errMsg });
          return Response.json({ status: "failed", error: errMsg, job });
        }
        job = await base44.entities.MeshyJob.update(job.id, {
          status: "rigging",
          meshy_rig_task_id: String(rigTaskId),
        });
        return Response.json({
          status: "rigging",
          progress: 0,
          message: "3D complete, auto-rigging started",
          job,
        });
      }
      if (t.status === "FAILED") {
        const errMsg = t.task_error?.message || "3D generation failed";
        job = await base44.entities.MeshyJob.update(job.id, { status: "failed", error_message: errMsg });
        return Response.json({ status: "failed", error: errMsg, job });
      }
      return Response.json({ status: "3d_generating", progress: t.progress || 0, job });
    }

    if (job.status === "3d_complete" || job.status === "rigging") {
      const res = await meshyFetch(key, "/rigging/" + job.meshy_rig_task_id);
      const t = res.data || {};

      if (t.status === "SUCCEEDED") {
        const r = t.result || {};
        job = await base44.entities.MeshyJob.update(job.id, {
          status: "complete",
          rigged_fbx_url: r.rigged_character_fbx_url || "",
          rigged_glb_url: r.rigged_character_glb_url || "",
          walking_fbx_url: r.basic_animations?.walking_fbx_url || "",
          running_fbx_url: r.basic_animations?.running_fbx_url || "",
          consumed_credits: t.consumed_credits || 0,
        });
        return Response.json({ status: "complete", progress: 100, job });
      }
      if (t.status === "FAILED") {
        const errMsg = t.task_error?.message || "Rigging failed";
        job = await base44.entities.MeshyJob.update(job.id, { status: "failed", error_message: errMsg });
        return Response.json({ status: "failed", error: errMsg, job });
      }
      return Response.json({ status: "rigging", progress: t.progress || 0, job });
    }

    return Response.json({ status: job.status, progress: 0, job });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});