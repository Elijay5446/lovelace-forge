import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getMeshyKey, meshyFetch } from '../../shared/meshy.ts';

// Meshy delivers a character's textures as separate PNGs on the ORIGINAL
// image-to-3d task — they are never embedded in the rigged FBX. Those URLs are
// signed and expire, so we fetch them fresh right before sending to Unity
// rather than trusting anything cached on the job record.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const jobId = body?.job_id;
    if (!jobId) return Response.json({ error: 'job_id is required' }, { status: 400 });

    const job = await base44.entities.MeshyJob.get(jobId).catch(() => null);
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    if (!job.meshy_3d_task_id) return Response.json({ error: 'This job has no Meshy 3D task.' }, { status: 400 });

    const { key } = await getMeshyKey(base44);
    if (!key) return Response.json({ error: 'Please connect your Meshy API key' }, { status: 400 });

    const res = await meshyFetch(key, '/image-to-3d/' + job.meshy_3d_task_id);
    const t = res.data?.result || res.data || {};
    const set = (t.texture_urls || [])[0] || {};

    const base_color = set.base_color || '';
    const normal = set.normal || '';

    // Cache for reference/debugging; the fresh values above are what get used.
    if (base_color && base_color !== job.texture_url) {
      await base44.entities.MeshyJob.update(job.id, { texture_url: base_color, normal_map_url: normal });
    }

    return Response.json({ base_color, normal, has_texture: !!base_color });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});