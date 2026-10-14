/**
 * Virtual Try-On Service
 *
 * No virtual try-on provider is configured (VIRTUAL_TRYON_API_KEY /
 * VIRTUAL_TRYON_PROVIDER_URL unset). This service implements the full
 * job lifecycle boundary (create job, check status) but NEVER fabricates
 * a successful result. Jobs are created with status "awaiting_configuration"
 * until a real provider is wired in, at which point `processJob` should
 * be implemented to call the provider and store the real result via
 * imageService.
 */

const env = require('../config/env');
const TryOnJob = require('../models/TryOnJob');

class TryOnService {
  constructor() {
    this.isConfigured = env.VIRTUAL_TRYON_CONFIGURED;
  }

  async createJob({ ownerId, userImageUrl, garmentImageUrl }) {
    const job = await TryOnJob.create({
      owner: ownerId,
      userImageUrl,
      garmentImageUrl,
      status: this.isConfigured ? 'pending' : 'awaiting_configuration',
    });

    if (this.isConfigured) {
      // Boundary for a real provider call — not implemented until credentials exist.
      // When implemented, this should call the provider asynchronously and
      // update the job's status/resultUrl via TryOnJob.findByIdAndUpdate.
      job.status = 'failed';
      job.errorMessage = 'Virtual try-on provider integration is not yet implemented.';
      await job.save();
    }

    return job;
  }

  async getJob({ jobId, ownerId }) {
    return TryOnJob.findOne({ _id: jobId, owner: ownerId });
  }
}

module.exports = new TryOnService();
