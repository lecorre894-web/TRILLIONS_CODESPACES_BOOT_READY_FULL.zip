module.exports = {
  boot() {
    return { ok: true, bootedAt: new Date().toISOString() };
  }
};
